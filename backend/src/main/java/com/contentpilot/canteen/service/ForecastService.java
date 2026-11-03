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
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ForecastService {

    private final ForecastRunRepository forecastRunRepository;
    private final ForecastLineRepository forecastLineRepository;
    private final AttendancePlanRepository attendancePlanRepository;
    private final MenuPlanRepository menuPlanRepository;
    private final MenuPlanItemRepository menuPlanItemRepository;
    private final DishRepository dishRepository;
    private final ProductionRecordRepository productionRecordRepository;

    /**
     * Run MealPredict forecasting for a school, date, and meal period.
     * All calculations are strictly deterministic and reproducible.
     */
    @Transactional
    public ForecastRun calculateForecast(Long schoolId, LocalDate serviceDate, String mealPeriod, Integer manualStudents, BigDecimal manualRate) {
        // 1. Fetch or create attendance expectation
        AttendancePlan attendance = attendancePlanRepository
                .findBySchoolIdAndServiceDateAndMealPeriod(schoolId, serviceDate, mealPeriod)
                .orElse(null);

        int students = manualStudents != null ? manualStudents : (attendance != null ? attendance.getExpectedStudents() : 500);
        BigDecimal rate = manualRate != null ? manualRate : (attendance != null ? attendance.getParticipationRate() : new BigDecimal("85.00"));

        BigDecimal expectedEatersDec = BigDecimal.valueOf(students)
                .multiply(rate)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        int totalExpectedEaters = expectedEatersDec.intValue();

        // 2. Fetch Menu Plan items
        MenuPlan menuPlan = menuPlanRepository
                .findBySchoolIdAndServiceDateAndMealPeriod(schoolId, serviceDate, mealPeriod)
                .orElse(null);

        List<MenuPlanItem> items = menuPlan != null ? menuPlanItemRepository.findByMenuPlanId(menuPlan.getId()) : List.of();

        String dayOfWeekRu = serviceDate.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.forLanguageTag("ru"));

        String explanation = String.format(
                "На дату %s (%s) ожидается %d учащихся со средним охватом питания %.1f%% (расчетное число питающихся: %d чел.). " +
                "Прогноз распределен по утвержденным блюдам с учетом технологических категорий СанПиН и структуры спроса.",
                serviceDate, dayOfWeekRu, students, rate.doubleValue(), totalExpectedEaters
        );

        ForecastRun run = ForecastRun.builder()
                .schoolId(schoolId)
                .serviceDate(serviceDate)
                .mealPeriod(mealPeriod)
                .modelVersion("SmartCanteen-Deterministic-v1")
                .explanation(explanation)
                .isDemo(attendance != null && attendance.getIsDemo())
                .build();
        run = forecastRunRepository.save(run);

        if (items.isEmpty()) {
            return run;
        }

        // Count main dishes vs sides/beverages
        List<MenuPlanItem> mains = new ArrayList<>();
        List<MenuPlanItem> others = new ArrayList<>();
        for (MenuPlanItem item : items) {
            Dish dish = dishRepository.findById(item.getDishId()).orElse(null);
            if (dish != null && ("Вторые блюда".equalsIgnoreCase(dish.getCategory()) || "Первые блюда".equalsIgnoreCase(dish.getCategory()))) {
                mains.add(item);
            } else {
                others.add(item);
            }
        }

        for (MenuPlanItem item : items) {
            Dish dish = dishRepository.findById(item.getDishId()).orElse(null);
            if (dish == null) continue;

            int predicted;
            if (mains.contains(item)) {
                if (mains.size() == 1) {
                    predicted = totalExpectedEaters;
                } else if (mains.size() == 2) {
                    // 65% for the first popular dish, 35% for the second
                    int idx = mains.indexOf(item);
                    predicted = (idx == 0)
                            ? (int) Math.round(totalExpectedEaters * 0.67)
                            : (int) Math.round(totalExpectedEaters * 0.33);
                } else {
                    predicted = (int) Math.round((double) totalExpectedEaters / mains.size());
                }
            } else {
                // Beverages, bakery, salads: 100% of eaters
                predicted = totalExpectedEaters;
            }

            int lowerBound = (int) Math.max(0, Math.round(predicted * 0.92));
            int upperBound = (int) Math.round(predicted * 1.08);

            String lineExplanation = String.format("Категория '%s'. Базовый расчет: %d порций (доверительный интервал [%d; %d]).",
                    dish.getCategory(), predicted, lowerBound, upperBound);

            ForecastLine line = ForecastLine.builder()
                    .forecastRunId(run.getId())
                    .dishId(dish.getId())
                    .predictedPortions(predicted)
                    .lowerBound(lowerBound)
                    .upperBound(upperBound)
                    .confidenceScore(new BigDecimal("93.50"))
                    .explanation(lineExplanation)
                    .build();
            forecastLineRepository.save(line);

            // Update forecast in menu plan item
            item.setForecastPortions(predicted);
            menuPlanItemRepository.save(item);
        }

        return run;
    }
}
