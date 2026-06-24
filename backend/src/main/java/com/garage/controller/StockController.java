package com.garage.controller;

import com.garage.dto.part.PartResponse;
import com.garage.dto.stock.StockRequest;
import com.garage.dto.stock.StockResponse;
import com.garage.model.Stock;
import com.garage.model.User;
import com.garage.repository.StockRepository;
import com.garage.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
                .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        return ResponseEntity.ok(StockResponse.fromEntity(stock));
    }

    @PostMapping
    public ResponseEntity<StockResponse> createStock(@Valid @RequestBody StockRequest request) {
        if (stockRepository.existsByName(request.getName())) {
            return ResponseEntity.badRequest().build();
        }
        Stock stock = new Stock(request.getName(), request.getDescription());
        stock = stockRepository.save(stock);
        return ResponseEntity.ok(StockResponse.fromEntity(stock));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockResponse> updateStock(@PathVariable Long id,
                                                      @Valid @RequestBody StockRequest request) {
        Stock stock = stockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Stock not found with id: " + id));
        stock.setName(request.getName());
        stock.setDescription(request.getDescription());
        stock = stockRepository.save(stock);
        return ResponseEntity.ok(StockResponse.fromEntity(stock));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        if (!stockRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        // Check if any parts reference this stock
        long partCount = partService.getPartsByStockId(id).size();
        if (partCount > 0) {
            return ResponseEntity.badRequest().build();
        }
        stockRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/parts")
    public ResponseEntity<List<PartResponse>> getPartsByStock(@PathVariable Long id) {
        return ResponseEntity.ok(partService.getPartsByStockId(id));
    }
}
