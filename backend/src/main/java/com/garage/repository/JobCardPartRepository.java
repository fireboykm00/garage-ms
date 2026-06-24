package com.garage.repository;

import com.garage.model.JobCardPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobCardPartRepository extends JpaRepository<JobCardPart, Long> {
    List<JobCardPart> findByJobCardId(Long jobCardId);
    Optional<JobCardPart> findByIdAndJobCardId(Long id, Long jobCardId);
    Optional<JobCardPart> findByJobCardIdAndPartId(Long jobCardId, Long partId);
}
