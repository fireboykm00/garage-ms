package com.garage.controller;

import com.garage.dto.stock.StockInRequest;
import com.garage.dto.stock.StockOutRequest;
import com.garage.dto.stock.StockTransactionResponse;
import com.garage.security.UserDetailsImpl;
import com.garage.service.AuthService;
import com.garage.service.StockTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockTransactionController {
    private final StockTransactionService stockTransactionService;
    private final AuthService authService;

    @PostMapping("/in")
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<StockTransactionResponse> stockIn(
            @Valid @RequestBody StockInRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(stockTransactionService.stockIn(request, authService.getCurrentUserInfo()));
    }

    @PostMapping("/out")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StockTransactionResponse> stockOut(
            @Valid @RequestBody StockOutRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(stockTransactionService.stockOut(request, authService.getCurrentUserInfo()));
    }

    @PostMapping("/undo/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<StockTransactionResponse> undoTransaction(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(stockTransactionService.undoTransaction(id, authService.getCurrentUserInfo()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<StockTransactionResponse>> getRecentTransactions() {
        return ResponseEntity.ok(stockTransactionService.getRecentTransactions());
    }

    @GetMapping("/transactions/in")
    public ResponseEntity<List<StockTransactionResponse>> getAllStockInTransactions() {
        return ResponseEntity.ok(stockTransactionService.getAllStockInTransactions());
    }
}
