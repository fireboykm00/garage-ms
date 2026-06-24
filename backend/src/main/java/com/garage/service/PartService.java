package com.garage.service;

import com.garage.dto.part.PartRequest;
import com.garage.dto.part.PartResponse;
import com.garage.exception.ResourceNotFoundException;
import com.garage.model.Part;
import com.garage.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PartService {
    private final PartRepository partRepository;

    public List<PartResponse> getAllParts() {
        return partRepository.findAll().stream().map(PartResponse::fromEntity).toList();
    }

    public PartResponse getPartById(Long id) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));
        return PartResponse.fromEntity(part);
    }

    public List<PartResponse> getLowStockParts() {
        return partRepository.findLowStockParts().stream().map(PartResponse::fromEntity).toList();
    }

    public boolean existsByPartNumber(String partNumber) {
        return partRepository.existsByPartNumber(partNumber);
    }

    @Transactional
    public PartResponse createPart(PartRequest request) {
        Part part = new Part(request.getPartNumber(), request.getName(), request.getModel(),
                request.getManufacturer(), request.getLocation(), request.getWarehouse(),
                request.getUnit(), request.getCurrentQuantity(), request.getMinimumQuantity());
        part.setOurPartNumber(request.getOurPartNumber());
        part = partRepository.save(part);
        return PartResponse.fromEntity(part);
    }

    @Transactional
    public PartResponse updatePart(Long id, PartRequest request) {
        Part part = partRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));
        part.setPartNumber(request.getPartNumber());
        part.setOurPartNumber(request.getOurPartNumber());
        part.setName(request.getName());
        part.setModel(request.getModel());
        part.setManufacturer(request.getManufacturer());
        part.setLocation(request.getLocation());
        part.setWarehouse(request.getWarehouse());
        part.setUnit(request.getUnit());
        part.setCurrentQuantity(request.getCurrentQuantity());
        part.setMinimumQuantity(request.getMinimumQuantity());
        part = partRepository.save(part);
        return PartResponse.fromEntity(part);
    }

    @Transactional
    public void deletePart(Long id) {
        if (!partRepository.existsById(id)) {
            throw new ResourceNotFoundException("Part not found with id: " + id);
        }
        partRepository.deleteById(id);
    }
}
