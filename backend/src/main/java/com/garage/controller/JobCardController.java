package com.garage.controller;

import com.garage.dto.job.AddPartRequest;
import com.garage.dto.job.JobCardPartResponse;
import com.garage.dto.job.JobCardRequest;
import com.garage.dto.job.JobCardResponse;
import com.garage.model.User;
import com.garage.model.enums.JobCardStatus;
import com.garage.security.UserDetailsImpl;
import com.garage.service.AuthService;
import com.garage.service.JobCardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/job-cards")
@RequiredArgsConstructor
public class JobCardController {
    private final JobCardService jobCardService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<List<JobCardResponse>> getAll() {
        return ResponseEntity.ok(jobCardService.getAllJobCards());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobCardResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(jobCardService.getJobCardById(id));
    }

    @PostMapping
    public ResponseEntity<JobCardResponse> create(
            @Valid @RequestBody JobCardRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserInfo();
        return ResponseEntity.ok(jobCardService.createJobCard(request, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobCardResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody JobCardRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserInfo();
        return ResponseEntity.ok(jobCardService.updateJobCard(id, request, user));
    }

    @PutMapping("/{id}/technical-report")
    public ResponseEntity<JobCardResponse> updateTechnicalReport(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(jobCardService.updateTechnicalReport(id, body.getOrDefault("report", "")));
    }

    @PutMapping("/{id}/work-completed")
    public ResponseEntity<JobCardResponse> updateWorkCompleted(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(jobCardService.updateWorkCompleted(id, body.getOrDefault("work", "")));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<JobCardResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserInfo();
        JobCardStatus status = JobCardStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(jobCardService.updateStatus(id, status, user));
    }

    @PostMapping("/{id}/parts")
    public ResponseEntity<JobCardPartResponse> addPart(
            @PathVariable Long id,
            @Valid @RequestBody AddPartRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserInfo();
        return ResponseEntity.ok(jobCardService.addPart(id, request, user));
    }

    @GetMapping("/{id}/parts")
    public ResponseEntity<List<JobCardPartResponse>> getParts(@PathVariable Long id) {
        return ResponseEntity.ok(jobCardService.getParts(id));
    }
}
