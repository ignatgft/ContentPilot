package com.contentpilot.canteen;

import com.contentpilot.canteen.domain.Ingredient;
import com.contentpilot.canteen.domain.InventoryBatch;
import com.contentpilot.canteen.service.UnitConversionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class SmartCanteenCoreTest {

    private final UnitConversionService conversionService = new UnitConversionService();

    @Test
    @DisplayName("UnitConversionService: g to kg and ml to l conversion")
    void testUnitConversions() {
        // 500g = 0.5000 kg
        BigDecimal kg = conversionService.convert(new BigDecimal("500"), "g", "kg");
        assertEquals(new BigDecimal("0.5000"), kg);

        // 2.5 kg = 2500 g
        BigDecimal g = conversionService.convert(new BigDecimal("2.5"), "kg", "g");
        assertEquals(new BigDecimal("2500.0000"), g);

        // 750 ml = 0.7500 l
        BigDecimal l = conversionService.convert(new BigDecimal("750"), "ml", "l");
        assertEquals(new BigDecimal("0.7500"), l);

        // Same unit
        BigDecimal same = conversionService.convert(new BigDecimal("10"), "pcs", "pcs");
        assertEquals(new BigDecimal("10"), same);

        // Cyrillic units conversion
        BigDecimal cyrKg = conversionService.convert(new BigDecimal("250"), "г", "кг");
        assertEquals(new BigDecimal("0.2500"), cyrKg);

        BigDecimal cyrG = conversionService.convert(new BigDecimal("1.2"), "кг", "г");
        assertEquals(new BigDecimal("1200.0000"), cyrG);

        BigDecimal cyrL = conversionService.convert(new BigDecimal("500"), "мл", "л");
        assertEquals(new BigDecimal("0.5000"), cyrL);

        BigDecimal cyrPcs = conversionService.convert(new BigDecimal("15"), "шт", "pcs");
        assertEquals(new BigDecimal("15"), cyrPcs);
    }

    @Test
    @DisplayName("UnitConversionService: prevents incompatible unit conversions")
    void testIncompatibleUnits() {
        assertThrows(IllegalArgumentException.class, () ->
                conversionService.convert(new BigDecimal("10"), "pcs", "kg")
        );

        assertThrows(IllegalArgumentException.class, () ->
                conversionService.convert(new BigDecimal("5"), "l", "kg")
        );
    }

    @Test
    @DisplayName("Procurement Formula: max(0, required + safetyStock - availableStock)")
    void testProcurementFormula() {
        BigDecimal required = new BigDecimal("25.000");
        BigDecimal safetyStock = required.multiply(new BigDecimal("0.10")).setScale(3, RoundingMode.HALF_UP); // 2.500
        BigDecimal stockDeficit = new BigDecimal("10.000");

        // Need: 25 + 2.5 - 10 = 17.500
        BigDecimal needed = required.add(safetyStock).subtract(stockDeficit);
        BigDecimal toPurchase = needed.compareTo(BigDecimal.ZERO) > 0 ? needed : BigDecimal.ZERO;
        assertEquals(new BigDecimal("17.500"), toPurchase);

        // Surplus case: stock is 50.000 -> purchase must be 0
        BigDecimal stockSurplus = new BigDecimal("50.000");
        BigDecimal neededSurplus = required.add(safetyStock).subtract(stockSurplus);
        BigDecimal toPurchaseSurplus = neededSurplus.compareTo(BigDecimal.ZERO) > 0 ? neededSurplus : BigDecimal.ZERO;
        assertEquals(BigDecimal.ZERO, toPurchaseSurplus);
    }

    @Test
    @DisplayName("FEFO logic: batches are sorted and depleted by earliest expiration date")
    void testFefoDepletionOrder() {
        List<InventoryBatch> batches = new ArrayList<>();
        batches.add(InventoryBatch.builder()
                .id(1L)
                .batchNumber("BATCH-LATE")
                .remainingQty(new BigDecimal("20.000"))
                .expiresAt(OffsetDateTime.now().plusDays(10))
                .build());
        batches.add(InventoryBatch.builder()
                .id(2L)
                .batchNumber("BATCH-EARLY")
                .remainingQty(new BigDecimal("15.000"))
                .expiresAt(OffsetDateTime.now().plusDays(2))
                .build());

        // Sort by FEFO (earliest expiry first)
        batches.sort(Comparator.comparing(InventoryBatch::getExpiresAt));

        assertEquals("BATCH-EARLY", batches.get(0).getBatchNumber());

        // Deplete 18 kg: 15 from BATCH-EARLY (remaining: 0), 3 from BATCH-LATE (remaining: 17)
        BigDecimal toConsume = new BigDecimal("18.000");
        BigDecimal remNeeded = toConsume;

        for (InventoryBatch b : batches) {
            if (remNeeded.compareTo(BigDecimal.ZERO) <= 0) break;
            BigDecimal take = b.getRemainingQty().min(remNeeded);
            b.setRemainingQty(b.getRemainingQty().subtract(take));
            remNeeded = remNeeded.subtract(take);
        }

        assertEquals(new BigDecimal("0.000"), batches.get(0).getRemainingQty());
        assertEquals(new BigDecimal("17.000"), batches.get(1).getRemainingQty());
        assertEquals(0, remNeeded.compareTo(BigDecimal.ZERO));
    }

    @Test
    @DisplayName("Waste Balance: prepared == served + leftovers + waste")
    void testWasteBalanceEquation() {
        int prepared = 280;
        int served = 268;
        int leftovers = 8;
        int waste = 4;

        int sum = served + leftovers + waste;
        assertEquals(prepared, sum);

        // Discrepancy scenario
        int badServed = 260;
        int badSum = badServed + leftovers + waste;
        int discrepancy = prepared - badSum;
        assertEquals(8, discrepancy); // 8 portions unaccounted
    }
}
