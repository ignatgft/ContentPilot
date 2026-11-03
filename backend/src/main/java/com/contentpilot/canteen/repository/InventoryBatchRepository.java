package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.InventoryBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface InventoryBatchRepository extends JpaRepository<InventoryBatch, Long> {
    List<InventoryBatch> findByIngredientId(Long ingredientId);

    // FEFO: Find active batches ordered by earliest expiration date
    @Query("SELECT b FROM InventoryBatch b WHERE b.ingredientId = :ingredientId AND b.remainingQty > 0 ORDER BY b.expiresAt ASC")
    List<InventoryBatch> findActiveBatchesFefo(@Param("ingredientId") Long ingredientId);

    // Expiring soon: batches expiring before given time
    @Query("SELECT b FROM InventoryBatch b WHERE b.remainingQty > 0 AND b.expiresAt <= :threshold ORDER BY b.expiresAt ASC")
    List<InventoryBatch> findExpiringBatches(@Param("threshold") OffsetDateTime threshold);

    @Query("SELECT COALESCE(SUM(b.remainingQty), 0) FROM InventoryBatch b WHERE b.ingredientId = :ingredientId AND b.remainingQty > 0")
    BigDecimal sumRemainingQtyByIngredientId(@Param("ingredientId") Long ingredientId);
}
