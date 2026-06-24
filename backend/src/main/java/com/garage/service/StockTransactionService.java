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

    public List<StockTransactionResponse> getRecentTransactions() {
        return stockTransactionRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(StockTransactionResponse::fromEntity).toList();
    }
}
