package com.garage.repository;

import com.garage.model.JobCardPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface JobCardPartRepository extends JpaRepository<JobCardPart, Long> {
    List<JobCardPart> findByJobCardId(Long jobCardId);
}
