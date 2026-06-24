package com.garage.service;

import com.garage.dto.part.PartRequest;
import com.garage.dto.part.PartResponse;
import com.garage.exception.ResourceNotFoundException;
import com.garage.model.Part;
import com.garage.model.Stock;
import com.garage.repository.PartRepository;
import com.garage.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PartService {
    private final PartRepository partRepository;
    private final StockRepository stockRepository;

    public List<PartResponse> getAllParts() {
        return partRepository.findAll().stream().map(PartResponse::fromEntity).toList();
    }

    public PartResponse getPartById(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));
        return PartResponse.fromEntity(part);
    }

    public List<PartResponse> getPartsByStockId(Long stockId) {
        return partRepository.findByStockIdOrderByNameAsc(stockId).stream()
                .map(PartResponse::fromEntity).toList();
    }

    public List<PartResponse> getLowStockParts() {
        return partRepository.findLowStockParts().stream().map(PartResponse::fromEntity).toList();
    }

    public boolean existsByPartNumber(String partNumber) {
        return partRepository.existsByPartNumber(partNumber);
    }

    @Transactional
    public PartResponse createPart(PartRequest request) {
        Stock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + request.getStockId()));
        Part part = new Part(request.getPartNumber(), request.getName(), request.getModel(),
                request.getManufacturer(), request.getUnit(), request.getCurrentQuantity(),
                request.getMinimumQuantity(), stock);
        part.setOurPartNumber(request.getOurPartNumber());
        part = partRepository.save(part);
        return PartResponse.fromEntity(part);
    }

    @Transactional
    public PartResponse updatePart(Long id, PartRequest request) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));
        Stock stock = stockRepository.findById(request.getStockId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + request.getStockId()));
        part.setPartNumber(request.getPartNumber());
        part.setOurPartNumber(request.getOurPartNumber());
        part.setName(request.getName());
        part.setModel(request.getModel());
        part.setManufacturer(request.getManufacturer());
        part.setUnit(request.getUnit());
        part.setCurrentQuantity(request.getCurrentQuantity());
        part.setMinimumQuantity(request.getMinimumQuantity());
        part.setStock(stock);
        part = partRepository.save(part);
        return PartResponse.fromEntity(part);
    }

    @Transactional
    public void deletePart(Long id) {
        if (!partRepository.existsById(id)) {
            throw new ResourceNotFoundException("Part not found with id: " + id);
        }
        // Check for stock transactions referencing this part first
        partRepository.deleteById(id);
    }
}
