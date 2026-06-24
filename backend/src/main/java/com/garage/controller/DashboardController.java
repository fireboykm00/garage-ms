package com.garage.controller;

import com.garage.dto.dashboard.DashboardStatsResponse;
import com.garage.dto.job.JobCardResponse;
import com.garage.model.enums.JobCardStatus;
import com.garage.model.enums.TransactionType;
import com.garage.repository.JobCardRepository;
import com.garage.repository.PartRepository;
import com.garage.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final PartRepository partRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final JobCardRepository jobCardRepository;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getStats() {
        long totalParts = partRepository.count();
        long totalStockIn = stockTransactionRepository.countByType(TransactionType.IN);
        long totalStockOut = stockTransactionRepository.countByType(TransactionType.OUT);
        long totalTransactions = totalStockIn + totalStockOut;
        long lowStockCount = partRepository.findLowStockParts().size();
        long openJobs = jobCardRepository.countByStatus(JobCardStatus.OPEN);
        long inProgressJobs = jobCardRepository.countByStatus(JobCardStatus.IN_PROGRESS);
        long completedToday = jobCardRepository.countCompletedToday();
        return ResponseEntity.ok(new DashboardStatsResponse(totalParts, totalStockIn, totalStockOut, totalTransactions, lowStockCount, openJobs, inProgressJobs, completedToday));
    }

    @GetMapping("/recent-jobs")
    @Transactional(readOnly = true)
    public ResponseEntity<List<JobCardResponse>> getRecentJobs() {
        List<JobCardResponse> jobs = jobCardRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(JobCardResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(jobs);
    }
}
