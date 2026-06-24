package com.garage.repository;

import com.garage.model.StockTransaction;
import com.garage.model.enums.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StockTransactionRepository extends JpaRepository<StockTransaction, Long> {
    List<StockTransaction> findByTypeOrderByCreatedAtDesc(TransactionType type);
    List<StockTransaction> findAllByOrderByCreatedAtDesc();
    long countByType(TransactionType type);
    List<StockTransaction> findTop10ByOrderByCreatedAtDesc();
    @Query("SELECT SUM(t.quantity) FROM StockTransaction t WHERE t.part.id = :partId AND t.type = 'OUT'")
    Long sumOutQuantityByPartId(@Param("partId") Long partId);
}
