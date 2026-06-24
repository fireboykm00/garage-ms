package com.garage.repository;

import com.garage.model.StockTransaction;
import com.garage.dto.report.AggregatedStockInEntry;
import com.garage.dto.report.AggregatedStockOutEntry;
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

    @Query("SELECT NEW com.garage.dto.report.AggregatedStockOutEntry(t.part.partNumber, t.part.name, SUM(t.quantity), CAST(t.createdAt AS date)) " +
           "FROM StockTransaction t WHERE t.type = 'OUT' " +
           "GROUP BY t.part.partNumber, t.part.name, CAST(t.createdAt AS date) " +
           "ORDER BY CAST(t.createdAt AS date) DESC, t.part.partNumber ASC")
    List<AggregatedStockOutEntry> findAggregatedStockOutReport();

    @Query("SELECT NEW com.garage.dto.report.AggregatedStockInEntry(t.part.partNumber, t.part.name, SUM(t.quantity), CAST(t.createdAt AS date)) " +
           "FROM StockTransaction t WHERE t.type = 'IN' " +
           "GROUP BY t.part.partNumber, t.part.name, CAST(t.createdAt AS date) " +
           "ORDER BY CAST(t.createdAt AS date) DESC, t.part.partNumber ASC")
    List<AggregatedStockInEntry> findAggregatedStockInReport();
}
