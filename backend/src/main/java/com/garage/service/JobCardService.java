package com.garage.service;

import com.garage.dto.job.AddPartRequest;
import com.garage.dto.job.ReplacePartRequest;
import com.garage.dto.job.JobCardPartResponse;
import com.garage.dto.job.JobCardRequest;
import com.garage.dto.job.JobCardResponse;
import com.garage.exception.BadRequestException;
import com.garage.exception.DuplicateFieldException;
import com.garage.exception.ResourceNotFoundException;
import com.garage.model.JobCard;
import com.garage.model.JobCardEvent;
import com.garage.model.JobCardPart;
import com.garage.model.Part;
import com.garage.model.StockTransaction;
import com.garage.model.User;
import com.garage.model.enums.EventType;
import com.garage.model.enums.JobCardStatus;
import com.garage.model.enums.TransactionSourceType;
import com.garage.model.enums.TransactionType;
import com.garage.repository.JobCardEventRepository;
import com.garage.repository.JobCardPartRepository;
import com.garage.repository.JobCardRepository;
import com.garage.repository.PartRepository;
import com.garage.repository.StockTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobCardService {
    private final JobCardRepository jobCardRepository;
    private final JobCardPartRepository jobCardPartRepository;
    private final PartRepository partRepository;
    private final StockTransactionRepository stockTransactionRepository;
    private final JobCardEventRepository jobCardEventRepository;

    public List<JobCardResponse> getAllJobCards(String vehicleRegistration, String customerPhone) {
        List<JobCard> results;
        if (vehicleRegistration != null && !vehicleRegistration.isBlank()) {
            results = jobCardRepository.findByVehicleRegistrationOrderByCreatedAtDesc(vehicleRegistration);
        } else if (customerPhone != null && !customerPhone.isBlank()) {
            results = jobCardRepository.findByCustomerPhoneOrderByCreatedAtDesc(customerPhone);
        } else {
            results = jobCardRepository.findAllByOrderByCreatedAtDesc();
        }
        return results.stream()
                .map(JobCardResponse::fromEntity).toList();
    }

    public JobCardResponse getJobCardById(Long id) {
        return JobCardResponse.fromEntity(jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + id)));
    }

    @Transactional
    public JobCardResponse createJobCard(JobCardRequest request, User user) {
        String jobNumber = generateJobNumber();
        // Safety check for race conditions on job_number
        int retries = 0;
        while (jobCardRepository.existsByJobNumber(jobNumber) && retries < 3) {
            jobNumber = generateJobNumber();
            retries++;
        }
        if (jobCardRepository.existsByJobNumber(jobNumber)) {
            throw new DuplicateFieldException("jobNumber", "Job number collision, please retry");
        }
        JobCard jobCard = new JobCard(jobNumber, request.getCustomerName(), request.getCustomerPhone(),
                request.getVehicleRegistration(), request.getVehicleModel(), request.getRequestedWork(), user);
        jobCard = jobCardRepository.save(jobCard);

        // Create event
        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.CREATED,
                "Job card " + jobNumber + " created", user.getFullName()));

        return JobCardResponse.fromEntity(jobCard);
    }

    @Transactional
    public JobCardResponse updateJobCard(Long id, JobCardRequest request, User user) {
        JobCard jobCard = jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + id));
        jobCard.setCustomerName(request.getCustomerName());
        jobCard.setCustomerPhone(request.getCustomerPhone());
        jobCard.setVehicleRegistration(request.getVehicleRegistration());
        jobCard.setVehicleModel(request.getVehicleModel());
        jobCard.setRequestedWork(request.getRequestedWork());
        jobCard.setUpdatedAt(LocalDateTime.now());
        jobCard = jobCardRepository.save(jobCard);

        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.REPORT_UPDATED,
                "Job card details updated", user.getFullName()));

        return JobCardResponse.fromEntity(jobCard);
    }

    @Transactional
    public JobCardResponse updateTechnicalReport(Long id, String technicalReport, User user) {
        JobCard jobCard = jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + id));
        jobCard.setTechnicalReport(technicalReport);
        jobCard.setUpdatedAt(LocalDateTime.now());
        jobCard = jobCardRepository.save(jobCard);

        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.REPORT_UPDATED,
                "Technical report updated", user.getFullName()));

        return JobCardResponse.fromEntity(jobCard);
    }

    @Transactional
    public JobCardResponse updateWorkCompleted(Long id, String workCompleted, User user) {
        JobCard jobCard = jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + id));
        jobCard.setWorkCompleted(workCompleted);
        jobCard.setUpdatedAt(LocalDateTime.now());
        jobCard = jobCardRepository.save(jobCard);

        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.WORK_COMPLETED_UPDATED,
                "Work completed details updated", user.getFullName()));

        return JobCardResponse.fromEntity(jobCard);
    }

    @Transactional
    public JobCardResponse updateStatus(Long id, JobCardStatus status, User user) {
        JobCard jobCard = jobCardRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + id));
        JobCardStatus oldStatus = jobCard.getStatus();

        jobCard.setStatus(status);
        jobCard.setUpdatedAt(LocalDateTime.now());
        jobCard = jobCardRepository.save(jobCard);

        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.STATUS_CHANGED,
                "Status changed from " + oldStatus + " to " + status, user.getFullName()));

        if (status == JobCardStatus.CANCELLED && oldStatus != JobCardStatus.CANCELLED) {
            restorePartsOnCancel(jobCard, user);
        } else if (status == JobCardStatus.OPEN && oldStatus == JobCardStatus.CANCELLED) {
            redeductPartsOnReopen(jobCard, user);
        }

        return JobCardResponse.fromEntity(jobCard);
    }

    private void restorePartsOnCancel(JobCard jobCard, User user) {
        List<JobCardPart> parts = jobCardPartRepository.findByJobCardId(jobCard.getId());
        for (JobCardPart jcp : parts) {
            Part part = jcp.getPart();
            part.setCurrentQuantity(part.getCurrentQuantity() + jcp.getQuantity());
            partRepository.save(part);

            StockTransaction tx = new StockTransaction(part, TransactionType.IN, jcp.getQuantity(),
                    "Returned from cancelled " + jobCard.getJobNumber(),
                    TransactionSourceType.JOB_CARD, jobCard.getJobNumber(), user);
            stockTransactionRepository.save(tx);
        }
    }

    private void redeductPartsOnReopen(JobCard jobCard, User user) {
        List<JobCardPart> parts = jobCardPartRepository.findByJobCardId(jobCard.getId());
        for (JobCardPart jcp : parts) {
            Part part = jcp.getPart();
            if (part.getCurrentQuantity() < jcp.getQuantity()) {
                throw new BadRequestException("Insufficient stock to reopen " + jobCard.getJobNumber()
                        + ". Part " + part.getPartNumber() + " has only " + part.getCurrentQuantity()
                        + ", needs " + jcp.getQuantity());
            }
            part.setCurrentQuantity(part.getCurrentQuantity() - jcp.getQuantity());
            partRepository.save(part);

            StockTransaction tx = new StockTransaction(part, TransactionType.OUT, jcp.getQuantity(),
                    "Reallocated for reopened " + jobCard.getJobNumber(),
                    TransactionSourceType.JOB_CARD, jobCard.getJobNumber(), user);
            stockTransactionRepository.save(tx);
        }
    }

    @Transactional
    public JobCardPartResponse addPart(Long jobCardId, AddPartRequest request, User user) {
        JobCard jobCard = jobCardRepository.findById(jobCardId)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + jobCardId));
        Part part = partRepository.findById(request.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + request.getPartId()));

        if (part.getCurrentQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock for " + part.getPartNumber()
                    + ". Available: " + part.getCurrentQuantity() + ", requested: " + request.getQuantity());
        }

        part.setCurrentQuantity(part.getCurrentQuantity() - request.getQuantity());
        partRepository.save(part);

        StockTransaction tx = new StockTransaction(part, TransactionType.OUT, request.getQuantity(),
                "Used on " + jobCard.getJobNumber(), TransactionSourceType.JOB_CARD, jobCard.getJobNumber(), user);
        stockTransactionRepository.save(tx);

        // UPSERT: find existing JobCardPart for this part on this job card, or create new with quantity 0
        JobCardPart jcp = jobCardPartRepository.findByJobCardIdAndPartId(jobCardId, request.getPartId())
                .orElseGet(() -> new JobCardPart(jobCard, part, 0));
        jcp.setQuantity(jcp.getQuantity() + request.getQuantity());
        jcp = jobCardPartRepository.save(jcp);

        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.PART_ADDED,
                request.getQuantity() + "x " + part.getName() + " (" + part.getPartNumber() + ") added"
                        + " — total: " + jcp.getQuantity() + "x on job card", user.getFullName()));

        return JobCardPartResponse.fromEntity(jcp);
    }

    @Transactional
    public void removePart(Long jobCardId, Long jobCardPartId, User user) {
        JobCard jobCard = jobCardRepository.findById(jobCardId)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + jobCardId));
        JobCardPart jcp = jobCardPartRepository.findByIdAndJobCardId(jobCardPartId, jobCardId)
                .orElseThrow(() -> new ResourceNotFoundException("Job card part not found with id: " + jobCardPartId));

        Part part = jcp.getPart();
        part.setCurrentQuantity(part.getCurrentQuantity() + jcp.getQuantity());
        partRepository.save(part);

        StockTransaction tx = new StockTransaction(part, TransactionType.IN, jcp.getQuantity(),
                "Removed from " + jobCard.getJobNumber(), TransactionSourceType.JOB_CARD, jobCard.getJobNumber(), user);
        stockTransactionRepository.save(tx);

        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.PART_REMOVED,
                jcp.getQuantity() + "x " + part.getName() + " (" + part.getPartNumber() + ") removed", user.getFullName()));

        jobCardPartRepository.delete(jcp);
    }

    @Transactional
    public JobCardPartResponse replacePart(Long jobCardId, Long jobCardPartId, ReplacePartRequest request, User user) {
        JobCard jobCard = jobCardRepository.findById(jobCardId)
                .orElseThrow(() -> new ResourceNotFoundException("Job card not found with id: " + jobCardId));
        JobCardPart oldJcp = jobCardPartRepository.findByIdAndJobCardId(jobCardPartId, jobCardId)
                .orElseThrow(() -> new ResourceNotFoundException("Job card part not found with id: " + jobCardPartId));

        Part oldPart = oldJcp.getPart();
        oldPart.setCurrentQuantity(oldPart.getCurrentQuantity() + oldJcp.getQuantity());
        partRepository.save(oldPart);

        StockTransaction inTx = new StockTransaction(oldPart, TransactionType.IN, oldJcp.getQuantity(),
                "Replaced from " + jobCard.getJobNumber(), TransactionSourceType.JOB_CARD, jobCard.getJobNumber(), user);
        stockTransactionRepository.save(inTx);

        Part newPart = partRepository.findById(request.getNewPartId())
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + request.getNewPartId()));

        if (newPart.getCurrentQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock for " + newPart.getPartNumber()
                    + ". Available: " + newPart.getCurrentQuantity() + ", requested: " + request.getQuantity());
        }

        newPart.setCurrentQuantity(newPart.getCurrentQuantity() - request.getQuantity());
        partRepository.save(newPart);

        StockTransaction outTx = new StockTransaction(newPart, TransactionType.OUT, request.getQuantity(),
                "Used on " + jobCard.getJobNumber(), TransactionSourceType.JOB_CARD, jobCard.getJobNumber(), user);
        stockTransactionRepository.save(outTx);

        JobCardPart newJcp = new JobCardPart(jobCard, newPart, request.getQuantity());
        newJcp = jobCardPartRepository.save(newJcp);

        jobCardPartRepository.delete(oldJcp);

        String eventDesc = String.format("Replaced %dx %s (%s) with %dx %s (%s)",
                oldJcp.getQuantity(), oldPart.getName(), oldPart.getPartNumber(),
                request.getQuantity(), newPart.getName(), newPart.getPartNumber());
        jobCardEventRepository.save(new JobCardEvent(jobCard, EventType.PART_REPLACED, eventDesc, user.getFullName()));

        return JobCardPartResponse.fromEntity(newJcp);
    }

    public List<JobCardPartResponse> getParts(Long jobCardId) {
        if (!jobCardRepository.existsById(jobCardId)) {
            throw new ResourceNotFoundException("Job card not found with id: " + jobCardId);
        }
        return jobCardPartRepository.findByJobCardId(jobCardId).stream()
                .map(JobCardPartResponse::fromEntity).toList();
    }

    public List<JobCardEvent> getEvents(Long jobCardId) {
        if (!jobCardRepository.existsById(jobCardId)) {
            throw new ResourceNotFoundException("Job card not found with id: " + jobCardId);
        }
        return jobCardEventRepository.findByJobCardIdOrderByCreatedAtAsc(jobCardId);
    }

    private String generateJobNumber() {
        String prefix = "JC-" + java.time.Year.now() + "-";
        long count = jobCardRepository.count() + 1;
        return prefix + String.format("%04d", count);
    }
}
