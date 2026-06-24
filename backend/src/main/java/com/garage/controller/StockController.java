package com.garage.controller;

import com.garage.dto.part.PartResponse;
import com.garage.dto.response.MessageResponse;
import com.garage.dto.stock.StockRequest;
import com.garage.dto.stock.StockResponse;
import com.garage.exception.ResourceNotFoundException;
import com.garage.model.Stock;
import com.garage.repository.StockRepository;
import com.garage.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {
    private final StockRepository stockRepository;
    private final PartService partService;

    @GetMapping
    public ResponseEntity<List<StockResponse>> getAllStocks() {
        return ResponseEntity.ok(
            stockRepository.findAllByOrderByNameAsc().stream()
                .map(StockResponse::fromEntity)
                .toList()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockResponse> getStock(@PathVariable Long id) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + id));
        return ResponseEntity.ok(StockResponse.fromEntity(stock));
    }

    @PostMapping
    public ResponseEntity<?> createStock(@Valid @RequestBody StockRequest request) {
        if (stockRepository.existsByName(request.getName())) {
            return ResponseEntity.badRequest().body(Map.of("name", "Stock name already exists"));
        }
        Stock stock = new Stock(request.getName(), request.getDescription());
        stock = stockRepository.save(stock);
        return ResponseEntity.ok(StockResponse.fromEntity(stock));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStock(@PathVariable Long id,
                                                      @Valid @RequestBody StockRequest request) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + id));
        if (!request.getName().equals(stock.getName()) && stockRepository.existsByName(request.getName())) {
            return ResponseEntity.badRequest().body(Map.of("name", "Stock name already exists"));
        }
        stock.setName(request.getName());
        stock.setDescription(request.getDescription());
        stock = stockRepository.save(stock);
        return ResponseEntity.ok(StockResponse.fromEntity(stock));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteStock(@PathVariable Long id) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found with id: " + id));
        long partCount = partService.getPartsByStockId(id).size();
        if (partCount > 0) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Cannot delete stock with existing parts. Remove parts first."));
        }
        stockRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/parts")
    public ResponseEntity<List<PartResponse>> getPartsByStock(@PathVariable Long id) {
        return ResponseEntity.ok(partService.getPartsByStockId(id));
    }
}
