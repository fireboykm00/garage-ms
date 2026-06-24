package com.garage.repository;

import com.garage.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StockRepository extends JpaRepository<Stock, Long> {
    boolean existsByName(String name);
    List<Stock> findAllByOrderByNameAsc();
    Optional<Stock> findByName(String name);
}
