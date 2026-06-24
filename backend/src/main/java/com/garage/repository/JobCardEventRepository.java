package com.garage.repository;

import com.garage.model.JobCardEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobCardEventRepository extends JpaRepository<JobCardEvent, Long> {
    List<JobCardEvent> findByJobCardIdOrderByCreatedAtAsc(Long jobCardId);
}
