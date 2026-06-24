package com.garage.controller;

import com.garage.dto.part.PartRequest;
import com.garage.dto.part.PartResponse;
import com.garage.dto.response.MessageResponse;
import com.garage.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/parts")
@RequiredArgsConstructor
public class PartController {
    private final PartService partService;

    @GetMapping
    public ResponseEntity<List<PartResponse>> getAllParts() {
        return ResponseEntity.ok(partService.getAllParts());
    }

    @GetMapping("/exists")
    public ResponseEntity<Boolean> checkPartNumberExists(@RequestParam String partNumber) {
        return ResponseEntity.ok(partService.existsByPartNumber(partNumber));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PartResponse> getPartById(@PathVariable Long id) {
        return ResponseEntity.ok(partService.getPartById(id));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<PartResponse>> getLowStockParts() {
        return ResponseEntity.ok(partService.getLowStockParts());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<PartResponse> createPart(@Valid @RequestBody PartRequest request) {
        return ResponseEntity.ok(partService.createPart(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STOREKEEPER')")
    public ResponseEntity<PartResponse> updatePart(@PathVariable Long id, @Valid @RequestBody PartRequest request) {
        return ResponseEntity.ok(partService.updatePart(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> deletePart(@PathVariable Long id) {
        partService.deletePart(id);
        return ResponseEntity.ok(new MessageResponse("Part deleted successfully"));
    }
}
