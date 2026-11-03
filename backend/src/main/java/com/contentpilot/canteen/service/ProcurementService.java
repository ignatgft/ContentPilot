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
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcurementService {

    private final ProcurementPlanRepository procurementPlanRepository;
    private final ProcurementLineRepository procurementLineRepository;
    private final MenuPlanRepository menuPlanRepository;
    private final MenuPlanItemRepository menuPlanItemRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryBatchRepository batchRepository;
    private final UnitConversionService conversionService;

    /**
     * Calculate Procurement Plan based on Menu Plan and actual stock balances.
     * Formula:
     *   required = sum(portions * norm)
     *   purchase = max(0, required + safetyStock - availableStock)
     */
    @Transactional
    public ProcurementPlan calculateProcurement(Long schoolId, LocalDate serviceDate, Long forecastRunId) {
        // 1. Fetch menu plan
        MenuPlan menuPlan = menuPlanRepository.findBySchoolIdAndServiceDateAndMealPeriod(schoolId, serviceDate, "LUNCH")
                .orElseThrow(() -> new IllegalArgumentException("План меню не найден на дату " + serviceDate));

        List<MenuPlanItem> items = menuPlanItemRepository.findByMenuPlanId(menuPlan.getId());
        if (items.isEmpty()) {
            throw new IllegalStateException("В плане меню на дату " + serviceDate + " нет блюд");
        }

        // 2. Aggregate ingredient requirements (in base units)
        Map<Long, BigDecimal> ingredientRequirements = new HashMap<>();

        for (MenuPlanItem item : items) {
            int portions = item.getPlannedPortions() != null && item.getPlannedPortions() > 0
                    ? item.getPlannedPortions()
                    : (item.getForecastPortions() != null ? item.getForecastPortions() : 0);

            if (portions <= 0) continue;

            Recipe recipe = recipeRepository.findFirstByDishIdAndActiveTrueOrderByVersionDesc(item.getDishId())
                    .orElse(null);
            if (recipe == null) continue;

            List<RecipeIngredient> recipeIngredients = recipeIngredientRepository.findByRecipeId(recipe.getId());
            for (RecipeIngredient ri : recipeIngredients) {
                Ingredient ing = ingredientRepository.findById(ri.getIngredientId()).orElse(null);
                if (ing == null) continue;

                // Norm for 1 portion converted to ingredient base unit
                BigDecimal normInBase = conversionService.convert(ri.getQuantity(), ri.getUnit(), ing.getBaseUnit());
                BigDecimal totalForDish = normInBase.multiply(BigDecimal.valueOf(portions));

                ingredientRequirements.merge(ing.getId(), totalForDish, BigDecimal::add);
            }
        }

        // 3. Create or update ProcurementPlan
        ProcurementPlan plan = procurementPlanRepository.findFirstBySchoolIdAndServiceDateOrderByCreatedAtDesc(schoolId, serviceDate)
                .orElse(ProcurementPlan.builder()
                        .schoolId(schoolId)
                        .serviceDate(serviceDate)
                        .forecastRunId(forecastRunId)
                        .status("CALCULATED")
                        .build());

        plan.setStatus("CALCULATED");
        plan.setForecastRunId(forecastRunId);
        plan = procurementPlanRepository.save(plan);

        // Delete old lines if recalculating
        List<ProcurementLine> existingLines = procurementLineRepository.findByProcurementPlanId(plan.getId());
        if (!existingLines.isEmpty()) {
            procurementLineRepository.deleteAll(existingLines);
        }

        BigDecimal grandTotalEstimatedCost = BigDecimal.ZERO;

        for (Map.Entry<Long, BigDecimal> entry : ingredientRequirements.entrySet()) {
            Long ingredientId = entry.getKey();
            BigDecimal reqQty = entry.getValue().setScale(3, RoundingMode.HALF_UP);

            Ingredient ing = ingredientRepository.findById(ingredientId).orElse(null);
            if (ing == null) continue;

            // Stock balance
            BigDecimal stockQty = batchRepository.sumRemainingQtyByIngredientId(ingredientId);
            if (stockQty == null) stockQty = BigDecimal.ZERO;

            // Safety stock (10% of requirement)
            BigDecimal safetyStock = reqQty.multiply(new BigDecimal("0.10")).setScale(3, RoundingMode.HALF_UP);

            // Purchase needed: max(0, reqQty + safetyStock - stockQty)
            BigDecimal needed = reqQty.add(safetyStock).subtract(stockQty);
            BigDecimal purchaseQty = needed.compareTo(BigDecimal.ZERO) > 0 ? needed : BigDecimal.ZERO;

            // Estimate cost based on latest batch or standard price
            List<InventoryBatch> batches = batchRepository.findByIngredientId(ingredientId);
            BigDecimal estimatedUnitCost = batches.isEmpty() ? new BigDecimal("100.00") : batches.get(batches.size() - 1).getUnitCost();
            BigDecimal estimatedTotalCost = purchaseQty.multiply(estimatedUnitCost).setScale(2, RoundingMode.HALF_UP);

            grandTotalEstimatedCost = grandTotalEstimatedCost.add(estimatedTotalCost);

            ProcurementLine line = ProcurementLine.builder()
                    .procurementPlanId(plan.getId())
                    .ingredientId(ingredientId)
                    .requiredQty(reqQty)
                    .stockQty(stockQty)
                    .safetyStock(safetyStock)
                    .purchaseQty(purchaseQty)
                    .unit(ing.getBaseUnit())
                    .estimatedUnitCost(estimatedUnitCost)
                    .estimatedTotalCost(estimatedTotalCost)
                    .build();
            procurementLineRepository.save(line);
        }

        plan.setTotalEstimatedCost(grandTotalEstimatedCost);
        return procurementPlanRepository.save(plan);
    }
}
