package com.garage.service;

import com.garage.dto.stock.StockInRequest;
import com.garage.dto.stock.StockOutRequest;
import com.garage.dto.stock.StockTransactionResponse;
import com.garage.exception.BadRequestException;
import com.garage.exception.ResourceNotFoundException;
import com.garage.model.Part;
import com.garage.model.StockTransaction;
import com.garage.model.User;
import com.garage.model.enums.TransactionSourceType;
import com.garage.model.enums.TransactionType;
import com.garage.repository.PartRepository;
import com.garage.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockTransactionService {
    private final StockTransactionRepository stockTransactionRepository;
    private final PartRepository partRepository;

    @Transactional
    public StockTransactionResponse stockIn(StockInRequest request, User user) {
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + request.getPartId()));
        part.setCurrentQuantity(part.getCurrentQuantity() + request.getQuantity());
        partRepository.save(part);
        StockTransaction tx = new StockTransaction(part, TransactionType.IN, request.getQuantity(), request.getNote(), user);
        tx = stockTransactionRepository.save(tx);
        return StockTransactionResponse.fromEntity(tx);
    }

    @Transactional
    public StockTransactionResponse stockOut(StockOutRequest request, User user) {
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + request.getPartId()));
        if (part.getCurrentQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + part.getCurrentQuantity() + ", requested: " + request.getQuantity());
        }
        part.setCurrentQuantity(part.getCurrentQuantity() - request.getQuantity());
        partRepository.save(part);
        StockTransaction tx = new StockTransaction(part, TransactionType.OUT, request.getQuantity(),
                request.getNote(), TransactionSourceType.MANUAL, null, user);
        tx = stockTransactionRepository.save(tx);
        return StockTransactionResponse.fromEntity(tx);
    }

    @Transactional
    public StockTransactionResponse undoTransaction(Long transactionId, User user) {
        StockTransaction tx = stockTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found with id: " + transactionId));

        Part part = tx.getPart();
        if (tx.getType() == TransactionType.IN) {
            // Reverse a stock in: subtract the quantity
            if (part.getCurrentQuantity() < tx.getQuantity()) {
                throw new BadRequestException("Cannot undo: insufficient stock. Available: "
                        + part.getCurrentQuantity() + ", transaction quantity: " + tx.getQuantity());
            }
            part.setCurrentQuantity(part.getCurrentQuantity() - tx.getQuantity());
        } else {
            // Reverse a stock out: add back the quantity
            part.setCurrentQuantity(part.getCurrentQuantity() + tx.getQuantity());
        }
        partRepository.save(part);

        // Create a reversal transaction
        TransactionType reversalType = tx.getType() == TransactionType.IN ? TransactionType.OUT : TransactionType.IN;
        StockTransaction reversal = new StockTransaction(part, reversalType, tx.getQuantity(),
                "Undo of transaction #" + transactionId + " (" + tx.getNote() + ")", user);
        reversal = stockTransactionRepository.save(reversal);

        return StockTransactionResponse.fromEntity(reversal);
    }

    public List<StockTransactionResponse> getRecentTransactions() {
        return stockTransactionRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(StockTransactionResponse::fromEntity).toList();
    }

    public List<StockTransactionResponse> getAllStockInTransactions() {
        return stockTransactionRepository.findByTypeOrderByCreatedAtDesc(TransactionType.IN).stream()
                .map(StockTransactionResponse::fromEntity).toList();
    }
}
