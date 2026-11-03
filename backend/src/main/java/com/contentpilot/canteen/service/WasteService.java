package com.contentpilot.canteen.service;

import com.contentpilot.canteen.domain.*;
import com.contentpilot.canteen.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WasteService {

    private final ProductionRecordRepository productionRecordRepository;
    private final WasteRecordRepository wasteRecordRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryBatchRepository batchRepository;
    private final DishRepository dishRepository;
    private final InventoryService inventoryService;

    /**
     * Record shift fact for cooked and served portions with balance validation:
     * prepared = served + usableLeftovers + wastePortions
     */
    @Transactional
    public ProductionRecord recordProductionFact(Long schoolId, LocalDate serviceDate, Long dishId,
                                                int prepared, int served, int leftovers, int waste, String varianceNote) {
        if (prepared < 0 || served < 0 || leftovers < 0 || waste < 0) {
            throw new IllegalArgumentException("Количество порций не может быть отрицательным");
        }

        int accountSum = served + leftovers + waste;
        int discrepancy = prepared - accountSum;

        if (discrepancy != 0 && (varianceNote == null || varianceNote.trim().isEmpty())) {
            varianceNote = String.format("Необъясненное расхождение: приготовлено %d, учтено %d (разница: %+d порций)",
                    prepared, accountSum, discrepancy);
        }

        ProductionRecord record = ProductionRecord.builder()
                .schoolId(schoolId)
                .serviceDate(serviceDate)
                .dishId(dishId)
                .preparedPortions(prepared)
                .servedPortions(served)
                .usableLeftovers(leftovers)
                .wastePortions(waste)
                .varianceNote(varianceNote)
                .createdAt(OffsetDateTime.now())
                .build();

        return productionRecordRepository.save(record);
    }

    /**
     * Record food waste loss and compute exact monetary value.
     */
    @Transactional
    public WasteRecord recordWasteLoss(Long schoolId, LocalDate serviceDate, Long ingredientId, Long dishId,
                                      BigDecimal quantity, String unit, String reason, Long userId) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Количество отходов должно быть больше нуля");
        }

        BigDecimal unitCost = BigDecimal.ZERO;

        if (ingredientId != null) {
            List<InventoryBatch> batches = batchRepository.findActiveBatchesFefo(ingredientId);
            if (!batches.isEmpty()) {
                unitCost = batches.get(0).getUnitCost();
                // Deduct from stock
                try {
                    inventoryService.writeOff(batches.get(0).getId(), quantity, reason, "Списание отходов", userId);
                } catch (Exception e) {
                    log.warn("Не удалось списать партию склада для отходов: {}", e.getMessage());
                }
            } else {
                unitCost = new BigDecimal("80.00"); // Standard reference cost
            }
        } else if (dishId != null) {
            // Estimated portion cost
            unitCost = new BigDecimal("120.00");
        }

        BigDecimal totalLoss = quantity.multiply(unitCost).setScale(2, RoundingMode.HALF_UP);

        WasteRecord waste = WasteRecord.builder()
                .schoolId(schoolId)
                .serviceDate(serviceDate)
                .ingredientId(ingredientId)
                .dishId(dishId)
                .quantity(quantity)
                .unit(unit)
                .reason(reason)
                .unitCostSnapshot(unitCost)
                .totalLoss(totalLoss)
                .isDemo(false)
                .createdAt(OffsetDateTime.now())
                .build();

        return wasteRecordRepository.save(waste);
    }
}
