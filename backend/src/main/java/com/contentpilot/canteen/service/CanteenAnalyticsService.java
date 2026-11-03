package com.contentpilot.canteen.service;

import com.contentpilot.canteen.domain.*;
import com.contentpilot.canteen.repository.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CanteenAnalyticsService {

    private final ProductionRecordRepository productionRecordRepository;
    private final WasteRecordRepository wasteRecordRepository;
    private final ProcurementPlanRepository procurementPlanRepository;
    private final InventoryBatchRepository batchRepository;
    private final SchoolRepository schoolRepository;
    private final InventoryService inventoryService;

    @Data
    @Builder
    public static class AnalyticsSummaryDto {
        private String schoolName;
        private String currency;
        private int totalPreparedPortions;
        private int totalServedPortions;
        private int totalWastePortions;
        private BigDecimal wasteRatePortions; // in %
        private BigDecimal servedRatePortions; // in %
        private BigDecimal totalProcurementCost; // in KGS
        private BigDecimal totalWasteCost; // in KGS
        private int expiringBatchesCount;
        private List<BatchAlertDto> expiringBatches;
        private List<DailyMetricDto> dailyMetrics;
    }

    @Data
    @Builder
    public static class BatchAlertDto {
        private Long batchId;
        private String ingredientName;
        private String batchNumber;
        private BigDecimal remainingQty;
        private String unit;
        private String expiresAt;
        private int daysRemaining;
    }

    @Data
    @Builder
    public static class DailyMetricDto {
        private String date;
        private int prepared;
        private int served;
        private int waste;
        private BigDecimal wasteCost;
    }

    public AnalyticsSummaryDto getSummary(Long schoolId) {
        School school = schoolRepository.findById(schoolId)
                .orElse(School.builder().name("Школьная столовая").currency("KGS").build());

        List<ProductionRecord> production = productionRecordRepository.findBySchoolIdOrderByServiceDateDesc(schoolId);
        List<WasteRecord> wasteRecords = wasteRecordRepository.findBySchoolIdOrderByServiceDateDesc(schoolId);
        List<ProcurementPlan> plans = procurementPlanRepository.findBySchoolIdOrderByServiceDateDesc(schoolId);

        int totalPrepared = production.stream().mapToInt(ProductionRecord::getPreparedPortions).sum();
        int totalServed = production.stream().mapToInt(ProductionRecord::getServedPortions).sum();
        int totalWaste = production.stream().mapToInt(ProductionRecord::getWastePortions).sum();

        BigDecimal wasteRate = (totalPrepared > 0)
                ? BigDecimal.valueOf(totalWaste)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalPrepared), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal servedRate = (totalPrepared > 0)
                ? BigDecimal.valueOf(totalServed)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalPrepared), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal totalWasteCost = wasteRecords.stream()
                .map(WasteRecord::getTotalLoss)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProcurementCost = plans.stream()
                .map(ProcurementPlan::getTotalEstimatedCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Expiring batches in next 3 days
        List<InventoryBatch> expiring = inventoryService.getExpiringBatches(3);
        List<BatchAlertDto> expiringDtos = new ArrayList<>();
        for (InventoryBatch b : expiring) {
            long days = java.time.temporal.ChronoUnit.DAYS.between(java.time.OffsetDateTime.now(), b.getExpiresAt());
            expiringDtos.add(BatchAlertDto.builder()
                    .batchId(b.getId())
                    .batchNumber(b.getBatchNumber())
                    .remainingQty(b.getRemainingQty())
                    .unit(b.getUnit())
                    .expiresAt(b.getExpiresAt().toLocalDate().toString())
                    .daysRemaining((int) days)
                    .build());
        }

        // Daily aggregates
        Map<LocalDate, DailyMetricDto.DailyMetricDtoBuilder> dailyMap = new TreeMap<>(Comparator.reverseOrder());
        for (ProductionRecord pr : production) {
            dailyMap.computeIfAbsent(pr.getServiceDate(), d -> DailyMetricDto.builder().date(d.toString()).wasteCost(BigDecimal.ZERO))
                    .prepared(pr.getPreparedPortions())
                    .served(pr.getServedPortions())
                    .waste(pr.getWastePortions());
        }

        List<DailyMetricDto> dailyList = new ArrayList<>();
        for (DailyMetricDto.DailyMetricDtoBuilder builder : dailyMap.values()) {
            dailyList.add(builder.build());
        }

        return AnalyticsSummaryDto.builder()
                .schoolName(school.getName())
                .currency(school.getCurrency() != null ? school.getCurrency() : "KGS")
                .totalPreparedPortions(totalPrepared)
                .totalServedPortions(totalServed)
                .totalWastePortions(totalWaste)
                .wasteRatePortions(wasteRate)
                .servedRatePortions(servedRate)
                .totalProcurementCost(totalProcurementCost)
                .totalWasteCost(totalWasteCost)
                .expiringBatchesCount(expiringDtos.size())
                .expiringBatches(expiringDtos)
                .dailyMetrics(dailyList)
                .build();
    }
}
