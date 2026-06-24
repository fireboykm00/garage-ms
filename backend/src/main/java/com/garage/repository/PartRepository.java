package com.garage.repository;

import com.garage.model.Part;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PartRepository extends JpaRepository<Part, Long> {
    boolean existsByPartNumber(String partNumber);
    List<Part> findByCurrentQuantityLessThanEqual(Integer minimumQuantity);
    @Query("SELECT p FROM Part p WHERE p.currentQuantity <= p.minimumQuantity")
    List<Part> findLowStockParts();
}
