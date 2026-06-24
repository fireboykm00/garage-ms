package com.garage.controller;

import com.garage.dto.job.AddPartRequest;
import com.garage.dto.job.JobCardEventResponse;
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
    public ResponseEntity<List<JobCardResponse>> getAll(
            @RequestParam(required = false) String vehicleRegistration,
            @RequestParam(required = false) String customerPhone) {
        return ResponseEntity.ok(jobCardService.getAllJobCards(vehicleRegistration, customerPhone));
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
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserInfo();
        return ResponseEntity.ok(jobCardService.updateTechnicalReport(id, body.getOrDefault("report", ""), user));
    }

    @PutMapping("/{id}/work-completed")
    public ResponseEntity<JobCardResponse> updateWorkCompleted(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserInfo();
        return ResponseEntity.ok(jobCardService.updateWorkCompleted(id, body.getOrDefault("work", ""), user));
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

    @DeleteMapping("/{jobCardId}/parts/{jobCardPartId}")
    public ResponseEntity<Void> removePart(
            @PathVariable Long jobCardId,
            @PathVariable Long jobCardPartId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getCurrentUserInfo();
        jobCardService.removePart(jobCardId, jobCardPartId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/events")
    public ResponseEntity<List<JobCardEventResponse>> getEvents(@PathVariable Long id) {
        List<JobCardEventResponse> events = jobCardService.getEvents(id).stream()
                .map(JobCardEventResponse::fromEntity).toList();
        return ResponseEntity.ok(events);
    }
}
