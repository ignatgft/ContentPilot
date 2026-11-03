package com.contentpilot.canteen.service;

import com.contentpilot.canteen.domain.Ingredient;
import com.contentpilot.canteen.domain.InventoryBatch;
import com.contentpilot.canteen.domain.InventoryMovement;
import com.contentpilot.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final IngredientRepository ingredientRepository;
    private final InventoryBatchRepository batchRepository;
    private final InventoryMovementRepository movementRepository;
    private final UnitConversionService conversionService;

    /**
     * Consume an ingredient using FEFO (First Expired, First Out).
     * Iterates through batches ordered by earliest expiration, depleting each batch
     * until the required quantity is satisfied.
     * Records an immutable InventoryMovement for each affected batch.
     */
    @Transactional
    public List<InventoryMovement> consumeFefo(Long ingredientId, BigDecimal neededQty, String unit,
                                              String referenceType, String referenceId, String note, Long userId) {
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new IllegalArgumentException("Ингредиент не найден: ID " + ingredientId));

        BigDecimal neededInBase = conversionService.convert(neededQty, unit, ingredient.getBaseUnit());
        if (neededInBase.compareTo(BigDecimal.ZERO) <= 0) {
            return List.of();
        }

        List<InventoryBatch> batches = batchRepository.findActiveBatchesFefo(ingredientId);
        BigDecimal totalAvailable = batches.stream()
                .map(InventoryBatch::getRemainingQty)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalAvailable.compareTo(neededInBase) < 0) {
            throw new IllegalStateException("Недостаточно остатка на складе для '" + ingredient.getName() +
                    "'. Требуется: " + neededInBase + " " + ingredient.getBaseUnit() +
                    ", доступно: " + totalAvailable + " " + ingredient.getBaseUnit());
        }

        BigDecimal remainingNeeded = neededInBase;
        List<InventoryMovement> movements = new ArrayList<>();

        for (InventoryBatch batch : batches) {
            if (remainingNeeded.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal toTake = batch.getRemainingQty().min(remainingNeeded);
            batch.setRemainingQty(batch.getRemainingQty().subtract(toTake));
            batchRepository.save(batch);

            InventoryMovement movement = InventoryMovement.builder()
                    .ingredientId(ingredientId)
                    .batchId(batch.getId())
                    .movementType("CONSUMPTION")
                    .quantity(toTake)
                    .unit(ingredient.getBaseUnit())
                    .unitCost(batch.getUnitCost())
                    .referenceType(referenceType)
                    .referenceId(referenceId)
                    .note(note)
                    .createdBy(userId)
                    .createdAt(OffsetDateTime.now())
                    .build();

            movements.add(movementRepository.save(movement));
            remainingNeeded = remainingNeeded.subtract(toTake);
        }

        return movements;
    }

    /**
     * Register a new batch arrival and record RECEIPT movement.
     */
    @Transactional
    public InventoryBatch receiveBatch(Long ingredientId, String batchNumber, BigDecimal quantity,
                                       String unit, BigDecimal unitCost, OffsetDateTime expiresAt,
                                       String supplier, Boolean isDemo, Long userId) {
        Ingredient ingredient = ingredientRepository.findById(ingredientId)
                .orElseThrow(() -> new IllegalArgumentException("Ингредиент не найден: ID " + ingredientId));

        BigDecimal qtyInBase = conversionService.convert(quantity, unit, ingredient.getBaseUnit());

        InventoryBatch batch = InventoryBatch.builder()
                .ingredientId(ingredientId)
                .batchNumber(batchNumber)
                .receivedQty(qtyInBase)
                .remainingQty(qtyInBase)
                .unit(ingredient.getBaseUnit())
                .unitCost(unitCost)
                .receivedAt(OffsetDateTime.now())
                .expiresAt(expiresAt)
                .supplier(supplier)
                .isDemo(Boolean.TRUE.equals(isDemo))
                .createdAt(OffsetDateTime.now())
                .build();

        batch = batchRepository.save(batch);

        InventoryMovement movement = InventoryMovement.builder()
                .ingredientId(ingredientId)
                .batchId(batch.getId())
                .movementType("RECEIPT")
                .quantity(qtyInBase)
                .unit(ingredient.getBaseUnit())
                .unitCost(unitCost)
                .referenceType("SUPPLIER_DELIVERY")
                .referenceId(batchNumber)
                .note("Поступление партии от " + supplier)
                .createdBy(userId)
                .createdAt(OffsetDateTime.now())
                .build();
        movementRepository.save(movement);

        return batch;
    }

    /**
     * Write off spoiled or expired goods from a specific batch or via FEFO.
     */
    @Transactional
    public InventoryMovement writeOff(Long batchId, BigDecimal quantity, String reason, String note, Long userId) {
        InventoryBatch batch = batchRepository.findById(batchId)
                .orElseThrow(() -> new IllegalArgumentException("Партия не найдена: ID " + batchId));

        if (quantity.compareTo(batch.getRemainingQty()) > 0) {
            throw new IllegalArgumentException("Количество списания (" + quantity + ") превышает остаток партии (" + batch.getRemainingQty() + ")");
        }

        batch.setRemainingQty(batch.getRemainingQty().subtract(quantity));
        batchRepository.save(batch);

        InventoryMovement movement = InventoryMovement.builder()
                .ingredientId(batch.getIngredientId())
                .batchId(batch.getId())
                .movementType("WRITE_OFF")
                .quantity(quantity)
                .unit(batch.getUnit())
                .unitCost(batch.getUnitCost())
                .referenceType(reason)
                .referenceId("BATCH-" + batch.getId())
                .note(note)
                .createdBy(userId)
                .createdAt(OffsetDateTime.now())
                .build();

        return movementRepository.save(movement);
    }

    /**
     * Get expiring batches (within next N days).
     */
    public List<InventoryBatch> getExpiringBatches(int daysThreshold) {
        OffsetDateTime threshold = OffsetDateTime.now().plusDays(daysThreshold);
        return batchRepository.findExpiringBatches(threshold);
    }

    /**
     * Get current stock balance for an ingredient.
     */
    public BigDecimal getStockBalance(Long ingredientId) {
        return batchRepository.sumRemainingQtyByIngredientId(ingredientId);
    }
}
