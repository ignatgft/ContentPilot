package com.contentpilot.canteen.controller;

import com.contentpilot.auth.User;
import com.contentpilot.auth.UserRepository;
import com.contentpilot.canteen.domain.*;
import com.contentpilot.canteen.repository.*;
import com.contentpilot.canteen.service.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/v1/canteen", "/api/canteen", "/api/admin"})
@RequiredArgsConstructor
@Slf4j
public class CanteenController {

    private final SchoolRepository schoolRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryBatchRepository batchRepository;
    private final InventoryMovementRepository movementRepository;
    private final DishRepository dishRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final AttendancePlanRepository attendancePlanRepository;
    private final MenuPlanRepository menuPlanRepository;
    private final MenuPlanItemRepository menuPlanItemRepository;
    private final ForecastRunRepository forecastRunRepository;
    private final ForecastLineRepository forecastLineRepository;
    private final ProcurementPlanRepository procurementPlanRepository;
    private final ProcurementLineRepository procurementLineRepository;
    private final ProductionRecordRepository productionRecordRepository;
    private final WasteRecordRepository wasteRecordRepository;
    private final StudentMealBookingRepository studentMealBookingRepository;
    private final AllergenRepository allergenRepository;
    private final UserRepository userRepository;

    private final InventoryService inventoryService;
    private final ForecastService forecastService;
    private final ProcurementService procurementService;
    private final WasteService wasteService;
    private final CanteenAnalyticsService analyticsService;
    private final MealBookingService mealBookingService;

    private School getOrCreateDefaultSchool(Long userId) {
        if (userId != null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getSchoolId() != null) {
                Optional<School> s = schoolRepository.findById(user.getSchoolId());
                if (s.isPresent()) return s.get();
            }
        }
        List<School> schools = schoolRepository.findAll();
        if (!schools.isEmpty()) return schools.get(0);

        School defaultSchool = School.builder()
                .name("Школа-лицей №24 им. А. Токомбаева (DEMO)")
                .address("г. Бишкек, ул. Тыныстанова, 110")
                .currency("KGS")
                .timezone("Asia/Bishkek")
                .totalStudents(650)
                .build();
        return schoolRepository.save(defaultSchool);
    }

    private Long getUserId(User user) {
        return user != null ? user.getId() : null;
    }

    // --- 0. Admin Dashboard ---
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardSummaryDto> getAdminDashboard(@AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate today = LocalDate.now();

        Optional<MenuPlan> menuPlanOpt = menuPlanRepository.findBySchoolIdAndServiceDateAndMealPeriod(
                school.getId(), today, "LUNCH"
        );
        int todayDishesCount = 0;
        int plannedPortions = 0;
        int forecastPortions = 0;
        String menuStatus = "DRAFT";
        if (menuPlanOpt.isPresent()) {
            menuStatus = menuPlanOpt.get().getStatus();
            List<MenuPlanItem> items = menuPlanItemRepository.findByMenuPlanId(menuPlanOpt.get().getId());
            todayDishesCount = items.size();
            plannedPortions = items.stream().mapToInt(MenuPlanItem::getPlannedPortions).sum();
            forecastPortions = items.stream().filter(i -> i.getForecastPortions() != null).mapToInt(MenuPlanItem::getForecastPortions).sum();
        }

        CanteenAnalyticsService.AnalyticsSummaryDto analytics = analyticsService.getSummary(school.getId());
        MealBookingService.BookingDailySummary bookings = mealBookingService.getSummary(school.getId(), today);

        List<Ingredient> ingredients = ingredientRepository.findBySchoolId(school.getId());
        long lowStockCount = ingredients.stream().filter(i -> {
            BigDecimal stock = batchRepository.sumRemainingQtyByIngredientId(i.getId());
            return stock == null || stock.compareTo(i.getMinBalance()) < 0;
        }).count();

        AdminDashboardSummaryDto dto = new AdminDashboardSummaryDto(
                school.getName(),
                school.getSlug() != null ? school.getSlug() : "school-24",
                school.getAddress(),
                school.getCurrency(),
                school.getTotalStudents(),
                Boolean.TRUE.equals(school.getIsMenuPublished()),
                Boolean.TRUE.equals(school.getAllergensVisible()),
                menuStatus,
                todayDishesCount,
                plannedPortions,
                forecastPortions,
                analytics.getTotalPreparedPortions(),
                analytics.getTotalServedPortions(),
                analytics.getTotalWastePortions(),
                analytics.getWasteRatePortions(),
                analytics.getExpiringBatchesCount(),
                (int) lowStockCount,
                bookings.getTotalBooked(),
                bookings.getTotalServed(),
                bookings.getPendingPickup(),
                bookings.getTotalRevenueKgs()
        );
        return ResponseEntity.ok(dto);
    }

    // --- 1. School & Settings ---
    @GetMapping("/school")
    public ResponseEntity<School> getSchool(@AuthenticationPrincipal User user) {
        Long userId = getUserId(user);
        return ResponseEntity.ok(getOrCreateDefaultSchool(userId));
    }

    @PutMapping("/school")
    public ResponseEntity<School> updateSchool(@RequestBody School updateReq,
                                               @AuthenticationPrincipal User user) {
        Long userId = getUserId(user);
        School school = getOrCreateDefaultSchool(userId);
        if (updateReq.getName() != null) school.setName(updateReq.getName());
        if (updateReq.getSlug() != null && !updateReq.getSlug().isBlank()) school.setSlug(updateReq.getSlug().trim());
        if (updateReq.getAddress() != null) school.setAddress(updateReq.getAddress());
        if (updateReq.getCurrency() != null) school.setCurrency(updateReq.getCurrency());
        if (updateReq.getTotalStudents() != null) school.setTotalStudents(updateReq.getTotalStudents());
        if (updateReq.getIsMenuPublished() != null) school.setIsMenuPublished(updateReq.getIsMenuPublished());
        if (updateReq.getAllergensVisible() != null) school.setAllergensVisible(updateReq.getAllergensVisible());
        school.setUpdatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(schoolRepository.save(school));
    }

    @PutMapping("/school/publish-menu")
    public ResponseEntity<School> toggleMenuPublication(@RequestParam boolean published,
                                                        @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        school.setIsMenuPublished(published);
        school.setUpdatedAt(OffsetDateTime.now());
        return ResponseEntity.ok(schoolRepository.save(school));
    }

    @GetMapping("/allergens")
    public ResponseEntity<List<Allergen>> getAllergens() {
        return ResponseEntity.ok(allergenRepository.findAll());
    }

    // --- 2. Dishes & Recipes ---
    @GetMapping("/dishes")
    public ResponseEntity<List<DishDto>> getDishes(@AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        List<Dish> dishes = dishRepository.findBySchoolId(school.getId());
        List<DishDto> dtos = new ArrayList<>();

        for (Dish dish : dishes) {
            dtos.add(mapToDishDto(dish));
        }
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/dishes/{dishId}")
    public ResponseEntity<DishDto> getDish(@PathVariable Long dishId,
                                           @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Блюдо #" + dishId + " не найдено"));
        if (!dish.getSchoolId().equals(school.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Доступ запрещен: блюдо принадлежит другой школе");
        }
        return ResponseEntity.ok(mapToDishDto(dish));
    }

    @PostMapping("/dishes")
    public ResponseEntity<Dish> createDish(@RequestBody DishCreateReq req,
                                           @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        Set<Allergen> allergenSet = new HashSet<>();
        if (req.getAllergenCodes() != null) {
            for (String code : req.getAllergenCodes()) {
                allergenRepository.findByCodeIgnoreCase(code).ifPresent(allergenSet::add);
            }
        }

        Dish dish = Dish.builder()
                .schoolId(school.getId())
                .name(req.getName())
                .category(req.getCategory())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .calories(req.getCalories() != null ? req.getCalories() : 350)
                .proteins(req.getProteins() != null ? req.getProteins() : new BigDecimal("12.0"))
                .fats(req.getFats() != null ? req.getFats() : new BigDecimal("10.0"))
                .carbs(req.getCarbs() != null ? req.getCarbs() : new BigDecimal("45.0"))
                .allergens(allergenSet)
                .active(true)
                .isDemo(false)
                .build();
        dish = dishRepository.save(dish);

        Recipe recipe = Recipe.builder()
                .dishId(dish.getId())
                .version(1)
                .yieldPortions(req.getYieldPortions() != null ? req.getYieldPortions() : 1)
                .instructions(req.getInstructions())
                .active(true)
                .build();
        recipe = recipeRepository.save(recipe);

        if (req.getIngredients() != null) {
            for (RecipeIngredientInput in : req.getIngredients()) {
                RecipeIngredient ri = RecipeIngredient.builder()
                        .recipeId(recipe.getId())
                        .ingredientId(in.getIngredientId())
                        .quantity(in.getQuantity())
                        .unit(in.getUnit())
                        .build();
                recipeIngredientRepository.save(ri);
            }
        }
        return ResponseEntity.ok(dish);
    }

    private DishDto mapToDishDto(Dish dish) {
        Recipe recipe = recipeRepository.findFirstByDishIdAndActiveTrueOrderByVersionDesc(dish.getId()).orElse(null);
        List<RecipeIngredientDto> ingDtos = new ArrayList<>();
        if (recipe != null) {
            List<RecipeIngredient> ris = recipeIngredientRepository.findByRecipeId(recipe.getId());
            for (RecipeIngredient ri : ris) {
                Ingredient ing = ingredientRepository.findById(ri.getIngredientId()).orElse(null);
                ingDtos.add(new RecipeIngredientDto(
                        ri.getId(),
                        ri.getIngredientId(),
                        ing != null ? ing.getName() : "Ингредиент",
                        ri.getQuantity(),
                        ri.getUnit()
                ));
            }
        }

        List<AllergenDto> allergenDtos = dish.getAllergens().stream()
                .map(a -> new AllergenDto(a.getId(), a.getCode(), a.getName(), a.getIcon(), a.getDescription()))
                .collect(Collectors.toList());

        return new DishDto(
                dish.getId(),
                dish.getName(),
                dish.getCategory(),
                dish.getDescription(),
                dish.getImageUrl(),
                dish.getCalories(),
                dish.getProteins(),
                dish.getFats(),
                dish.getCarbs(),
                allergenDtos,
                dish.getActive(),
                dish.getIsDemo(),
                recipe != null ? recipe.getYieldPortions() : 1,
                recipe != null ? recipe.getInstructions() : "",
                ingDtos
        );
    }

    // --- 3. Inventory & Batches ---
    @GetMapping("/ingredients")
    public ResponseEntity<List<IngredientStockDto>> getIngredients(@AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        List<Ingredient> ings = ingredientRepository.findBySchoolId(school.getId());
        List<IngredientStockDto> dtos = new ArrayList<>();
        for (Ingredient ing : ings) {
            BigDecimal currentStock = batchRepository.sumRemainingQtyByIngredientId(ing.getId());
            if (currentStock == null) currentStock = BigDecimal.ZERO;
            dtos.add(new IngredientStockDto(
                    ing.getId(),
                    ing.getName(),
                    ing.getCategory(),
                    ing.getBaseUnit(),
                    ing.getMinBalance(),
                    currentStock,
                    currentStock.compareTo(ing.getMinBalance()) < 0,
                    ing.getIsDemo()
            ));
        }
        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/ingredients")
    public ResponseEntity<Ingredient> createIngredient(@RequestBody Ingredient ingReq,
                                                       @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        ingReq.setSchoolId(school.getId());
        if (ingReq.getMinBalance() == null) ingReq.setMinBalance(BigDecimal.ZERO);
        ingReq.setActive(true);
        ingReq.setIsDemo(false);
        return ResponseEntity.ok(ingredientRepository.save(ingReq));
    }

    @GetMapping("/inventory/batches")
    public ResponseEntity<List<InventoryBatch>> getBatches(@RequestParam(required = false) Long ingredientId) {
        if (ingredientId != null) {
            return ResponseEntity.ok(batchRepository.findActiveBatchesFefo(ingredientId));
        }
        return ResponseEntity.ok(batchRepository.findAll());
    }

    @PostMapping("/inventory/batches")
    public ResponseEntity<InventoryBatch> receiveBatch(@RequestBody BatchReceiveReq req,
                                                       @AuthenticationPrincipal User user) {
        Long userId = getUserId(user);
        InventoryBatch b = inventoryService.receiveBatch(
                req.getIngredientId(),
                req.getBatchNumber(),
                req.getQuantity(),
                req.getUnit(),
                req.getUnitCost(),
                req.getExpiresAt(),
                req.getSupplier(),
                false,
                userId
        );
        return ResponseEntity.ok(b);
    }

    @PostMapping("/inventory/write-off")
    public ResponseEntity<InventoryMovement> writeOff(@RequestBody BatchWriteOffReq req,
                                                      @AuthenticationPrincipal User user) {
        Long userId = getUserId(user);
        InventoryMovement m = inventoryService.writeOff(req.getBatchId(), req.getQuantity(), req.getReason(), req.getNote(), userId);
        return ResponseEntity.ok(m);
    }

    // --- 4. Menu & Daily Planning ---
    @GetMapping("/menu")
    public ResponseEntity<MenuPlanViewDto> getMenu(@RequestParam(required = false) String date,
                                                   @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate serviceDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        MenuPlan plan = menuPlanRepository.findBySchoolIdAndServiceDateAndMealPeriod(school.getId(), serviceDate, "LUNCH").orElse(null);
        List<MenuPlanItemDto> itemDtos = new ArrayList<>();
        if (plan != null) {
            List<MenuPlanItem> items = menuPlanItemRepository.findByMenuPlanId(plan.getId());
            for (MenuPlanItem i : items) {
                Dish d = dishRepository.findById(i.getDishId()).orElse(null);
                itemDtos.add(new MenuPlanItemDto(
                        i.getId(),
                        i.getDishId(),
                        d != null ? d.getName() : "Блюдо",
                        d != null ? d.getCategory() : "",
                        i.getPlannedPortions(),
                        i.getForecastPortions()
                ));
            }
        }
        return ResponseEntity.ok(new MenuPlanViewDto(
                plan != null ? plan.getId() : null,
                serviceDate.toString(),
                plan != null ? plan.getStatus() : "NOT_PLANNED",
                itemDtos
        ));
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuPlanViewDto> saveMenu(@RequestBody MenuPlanSaveReq req,
                                                    @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate serviceDate = req.getDate() != null ? LocalDate.parse(req.getDate()) : LocalDate.now();

        MenuPlan plan = menuPlanRepository.findBySchoolIdAndServiceDateAndMealPeriod(school.getId(), serviceDate, "LUNCH")
                .orElse(MenuPlan.builder()
                        .schoolId(school.getId())
                        .serviceDate(serviceDate)
                        .mealPeriod("LUNCH")
                        .build());
        plan.setStatus("APPROVED");
        plan = menuPlanRepository.save(plan);

        // Delete existing items
        List<MenuPlanItem> oldItems = menuPlanItemRepository.findByMenuPlanId(plan.getId());
        if (!oldItems.isEmpty()) {
            menuPlanItemRepository.deleteAll(oldItems);
        }

        List<MenuPlanItemDto> itemDtos = new ArrayList<>();
        if (req.getItems() != null) {
            for (MenuPlanItemSaveInput in : req.getItems()) {
                MenuPlanItem item = MenuPlanItem.builder()
                        .menuPlanId(plan.getId())
                        .dishId(in.getDishId())
                        .plannedPortions(in.getPlannedPortions())
                        .forecastPortions(in.getForecastPortions())
                        .build();
                item = menuPlanItemRepository.save(item);
                Dish d = dishRepository.findById(item.getDishId()).orElse(null);
                itemDtos.add(new MenuPlanItemDto(
                        item.getId(),
                        item.getDishId(),
                        d != null ? d.getName() : "Блюдо",
                        d != null ? d.getCategory() : "",
                        item.getPlannedPortions(),
                        item.getForecastPortions()
                ));
            }
        }

        return ResponseEntity.ok(new MenuPlanViewDto(plan.getId(), serviceDate.toString(), plan.getStatus(), itemDtos));
    }

    // --- 5. Forecast (MealPredict) ---
    @GetMapping("/forecast")
    public ResponseEntity<ForecastViewDto> getForecast(@RequestParam(required = false) String date,
                                                       @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate serviceDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        ForecastRun run = forecastRunRepository.findFirstBySchoolIdAndServiceDateAndMealPeriodOrderByCreatedAtDesc(school.getId(), serviceDate, "LUNCH").orElse(null);
        if (run == null) {
            run = forecastService.calculateForecast(school.getId(), serviceDate, "LUNCH", null, null);
        }

        List<ForecastLine> lines = forecastLineRepository.findByForecastRunId(run.getId());
        List<ForecastLineDto> lineDtos = new ArrayList<>();
        int totalPredicted = 0;
        for (ForecastLine l : lines) {
            Dish d = dishRepository.findById(l.getDishId()).orElse(null);
            totalPredicted += l.getPredictedPortions();
            lineDtos.add(new ForecastLineDto(
                    l.getId(),
                    l.getDishId(),
                    d != null ? d.getName() : "Блюдо",
                    d != null ? d.getCategory() : "",
                    l.getPredictedPortions(),
                    l.getLowerBound(),
                    l.getUpperBound(),
                    l.getConfidenceScore(),
                    l.getExplanation()
            ));
        }

        return ResponseEntity.ok(new ForecastViewDto(
                run.getId(),
                serviceDate.toString(),
                totalPredicted,
                run.getModelVersion(),
                run.getExplanation(),
                lineDtos
        ));
    }

    @PostMapping("/forecast/calculate")
    public ResponseEntity<ForecastViewDto> triggerForecast(@RequestBody ForecastCalculateReq req,
                                                           @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate serviceDate = req.getDate() != null ? LocalDate.parse(req.getDate()) : LocalDate.now();

        ForecastRun run = forecastService.calculateForecast(school.getId(), serviceDate, "LUNCH", req.getExpectedStudents(), req.getParticipationRate());
        List<ForecastLine> lines = forecastLineRepository.findByForecastRunId(run.getId());
        List<ForecastLineDto> lineDtos = new ArrayList<>();
        int totalPredicted = 0;
        for (ForecastLine l : lines) {
            Dish d = dishRepository.findById(l.getDishId()).orElse(null);
            totalPredicted += l.getPredictedPortions();
            lineDtos.add(new ForecastLineDto(
                    l.getId(),
                    l.getDishId(),
                    d != null ? d.getName() : "Блюдо",
                    d != null ? d.getCategory() : "",
                    l.getPredictedPortions(),
                    l.getLowerBound(),
                    l.getUpperBound(),
                    l.getConfidenceScore(),
                    l.getExplanation()
            ));
        }

        return ResponseEntity.ok(new ForecastViewDto(
                run.getId(),
                serviceDate.toString(),
                totalPredicted,
                run.getModelVersion(),
                run.getExplanation(),
                lineDtos
        ));
    }

    // --- 6. ProcurementPlanner ---
    @GetMapping("/procurement")
    public ResponseEntity<ProcurementPlanViewDto> getProcurement(@RequestParam(required = false) String date,
                                                                 @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate serviceDate = date != null ? LocalDate.parse(date) : LocalDate.now();

        ProcurementPlan plan = procurementPlanRepository.findFirstBySchoolIdAndServiceDateOrderByCreatedAtDesc(school.getId(), serviceDate).orElse(null);
        if (plan == null) {
            try {
                plan = procurementService.calculateProcurement(school.getId(), serviceDate, null);
            } catch (Exception e) {
                return ResponseEntity.ok(new ProcurementPlanViewDto(null, serviceDate.toString(), "NOT_CALCULATED", BigDecimal.ZERO, List.of()));
            }
        }

        List<ProcurementLine> lines = procurementLineRepository.findByProcurementPlanId(plan.getId());
        List<ProcurementLineDto> lineDtos = new ArrayList<>();
        for (ProcurementLine l : lines) {
            Ingredient ing = ingredientRepository.findById(l.getIngredientId()).orElse(null);
            lineDtos.add(new ProcurementLineDto(
                    l.getId(),
                    l.getIngredientId(),
                    ing != null ? ing.getName() : "Ингредиент",
                    l.getRequiredQty(),
                    l.getStockQty(),
                    l.getSafetyStock(),
                    l.getPurchaseQty(),
                    l.getUnit(),
                    l.getEstimatedUnitCost(),
                    l.getEstimatedTotalCost()
            ));
        }

        return ResponseEntity.ok(new ProcurementPlanViewDto(
                plan.getId(),
                serviceDate.toString(),
                plan.getStatus(),
                plan.getTotalEstimatedCost(),
                lineDtos
        ));
    }

    @PostMapping("/procurement/calculate")
    public ResponseEntity<ProcurementPlanViewDto> calculateProcurement(@RequestBody ProcurementCalcReq req,
                                                                       @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate serviceDate = req.getDate() != null ? LocalDate.parse(req.getDate()) : LocalDate.now();

        ProcurementPlan plan = procurementService.calculateProcurement(school.getId(), serviceDate, req.getForecastRunId());
        List<ProcurementLine> lines = procurementLineRepository.findByProcurementPlanId(plan.getId());
        List<ProcurementLineDto> lineDtos = new ArrayList<>();
        for (ProcurementLine l : lines) {
            Ingredient ing = ingredientRepository.findById(l.getIngredientId()).orElse(null);
            lineDtos.add(new ProcurementLineDto(
                    l.getId(),
                    l.getIngredientId(),
                    ing != null ? ing.getName() : "Ингредиент",
                    l.getRequiredQty(),
                    l.getStockQty(),
                    l.getSafetyStock(),
                    l.getPurchaseQty(),
                    l.getUnit(),
                    l.getEstimatedUnitCost(),
                    l.getEstimatedTotalCost()
            ));
        }

        return ResponseEntity.ok(new ProcurementPlanViewDto(
                plan.getId(),
                serviceDate.toString(),
                plan.getStatus(),
                plan.getTotalEstimatedCost(),
                lineDtos
        ));
    }

    // --- 7. WasteGuard & Production Records ---
    @GetMapping("/waste")
    public ResponseEntity<WasteSummaryDto> getWasteRecords(@AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        List<ProductionRecord> production = productionRecordRepository.findBySchoolIdOrderByServiceDateDesc(school.getId());
        List<WasteRecord> waste = wasteRecordRepository.findBySchoolIdOrderByServiceDateDesc(school.getId());

        List<ProductionFactDto> prodDtos = new ArrayList<>();
        for (ProductionRecord p : production) {
            Dish d = dishRepository.findById(p.getDishId()).orElse(null);
            prodDtos.add(new ProductionFactDto(
                    p.getId(),
                    p.getServiceDate().toString(),
                    p.getDishId(),
                    d != null ? d.getName() : "Блюдо",
                    p.getPreparedPortions(),
                    p.getServedPortions(),
                    p.getUsableLeftovers(),
                    p.getWastePortions(),
                    p.getVarianceNote()
            ));
        }

        List<WasteRecordDto> wasteDtos = new ArrayList<>();
        for (WasteRecord w : waste) {
            Ingredient ing = w.getIngredientId() != null ? ingredientRepository.findById(w.getIngredientId()).orElse(null) : null;
            Dish d = w.getDishId() != null ? dishRepository.findById(w.getDishId()).orElse(null) : null;
            wasteDtos.add(new WasteRecordDto(
                    w.getId(),
                    w.getServiceDate().toString(),
                    ing != null ? ing.getName() : (d != null ? d.getName() : "Продукт"),
                    w.getQuantity(),
                    w.getUnit(),
                    w.getReason(),
                    w.getUnitCostSnapshot(),
                    w.getTotalLoss()
            ));
        }

        return ResponseEntity.ok(new WasteSummaryDto(prodDtos, wasteDtos));
    }

    @PostMapping("/waste/production")
    public ResponseEntity<ProductionRecord> recordProductionFact(@RequestBody ProductionFactReq req,
                                                                 @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate serviceDate = req.getDate() != null ? LocalDate.parse(req.getDate()) : LocalDate.now();

        ProductionRecord p = wasteService.recordProductionFact(
                school.getId(),
                serviceDate,
                req.getDishId(),
                req.getPreparedPortions(),
                req.getServedPortions(),
                req.getUsableLeftovers(),
                req.getWastePortions(),
                req.getVarianceNote()
        );
        return ResponseEntity.ok(p);
    }

    @PostMapping("/waste/record")
    public ResponseEntity<WasteRecord> recordWasteLoss(@RequestBody WasteRecordReq req,
                                                       @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        Long userId = getUserId(user);
        LocalDate serviceDate = req.getDate() != null ? LocalDate.parse(req.getDate()) : LocalDate.now();

        WasteRecord w = wasteService.recordWasteLoss(
                school.getId(),
                serviceDate,
                req.getIngredientId(),
                req.getDishId(),
                req.getQuantity(),
                req.getUnit(),
                req.getReason(),
                userId
        );
        return ResponseEntity.ok(w);
    }

    // --- 8. Analytics & Summary ---
    @GetMapping("/analytics")
    public ResponseEntity<CanteenAnalyticsService.AnalyticsSummaryDto> getAnalytics(@AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        return ResponseEntity.ok(analyticsService.getSummary(school.getId()));
    }

    // --- 9. Student Meal Bookings (Предзаказ питания) ---
    @GetMapping("/bookings")
    public ResponseEntity<List<MealBookingService.BookingResponse>> getBookings(
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate d = (date != null && !date.isBlank()) ? LocalDate.parse(date) : null;
        return ResponseEntity.ok(mealBookingService.getBookings(school.getId(), d, grade, status));
    }

    @PostMapping("/bookings")
    public ResponseEntity<MealBookingService.BookingResponse> createBooking(
            @RequestBody MealBookingService.CreateBookingRequest req,
            @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        if (req.getSchoolId() == null) {
            req.setSchoolId(school.getId());
        }
        return ResponseEntity.ok(mealBookingService.createBooking(req));
    }

    @GetMapping("/bookings/verify/{code}")
    public ResponseEntity<MealBookingService.BookingResponse> verifyBookingCode(@PathVariable String code) {
        return ResponseEntity.ok(mealBookingService.verifyCode(code));
    }

    @PostMapping("/bookings/serve/{code}")
    public ResponseEntity<MealBookingService.BookingResponse> serveBookingByCode(@PathVariable String code) {
        return ResponseEntity.ok(mealBookingService.serveBookingByCode(code));
    }

    @PostMapping("/bookings/{id}/serve")
    public ResponseEntity<MealBookingService.BookingResponse> serveBookingById(@PathVariable Long id) {
        StudentMealBooking booking = studentMealBookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Бронирование с id " + id + " не найдено"));
        return ResponseEntity.ok(mealBookingService.serveBookingByCode(booking.getCode()));
    }

    @PostMapping("/bookings/{id}/cancel")
    public ResponseEntity<MealBookingService.BookingResponse> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(mealBookingService.cancelBooking(id));
    }

    @GetMapping("/bookings/summary")
    public ResponseEntity<MealBookingService.BookingDailySummary> getBookingSummary(
            @RequestParam(required = false) String date,
            @AuthenticationPrincipal User user) {
        School school = getOrCreateDefaultSchool(getUserId(user));
        LocalDate d = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(mealBookingService.getSummary(school.getId(), d));
    }

    private Long getUserId(org.springframework.security.core.userdetails.User principal) {
        if (principal == null) return null;
        return userRepository.findByEmail(principal.getUsername()).map(User::getId).orElse(null);
    }

    // --- DTO Classes ---
    @Data public static class DishCreateReq {
        private String name;
        private String category;
        private String description;
        private String imageUrl;
        private Integer calories;
        private BigDecimal proteins;
        private BigDecimal fats;
        private BigDecimal carbs;
        private List<String> allergenCodes;
        private Integer yieldPortions;
        private String instructions;
        private List<RecipeIngredientInput> ingredients;
    }
    @Data public static class RecipeIngredientInput {
        private Long ingredientId;
        private BigDecimal quantity;
        private String unit;
    }
    public record AllergenDto(Long id, String code, String name, String icon, String description) {}
    public record DishDto(Long id, String name, String category, String description, String imageUrl,
                          Integer calories, BigDecimal proteins, BigDecimal fats, BigDecimal carbs,
                          List<AllergenDto> allergens, Boolean active, Boolean isDemo,
                          Integer yieldPortions, String instructions, List<RecipeIngredientDto> ingredients) {}
    public record AdminDashboardSummaryDto(
            String schoolName,
            String schoolSlug,
            String address,
            String currency,
            Integer totalStudents,
            boolean isMenuPublished,
            boolean allergensVisible,
            String menuStatus,
            int todayDishesCount,
            int plannedPortions,
            int forecastPortions,
            int totalPreparedPortions,
            int totalServedPortions,
            int totalWastePortions,
            BigDecimal wasteRatePortions,
            int expiringBatchesCount,
            int lowStockCount,
            long totalBooked,
            long totalServed,
            long pendingPickup,
            BigDecimal totalRevenueKgs
    ) {}
    public record RecipeIngredientDto(Long id, Long ingredientId, String ingredientName, BigDecimal quantity, String unit) {}
    public record IngredientStockDto(Long id, String name, String category, String baseUnit, BigDecimal minBalance,
                                     BigDecimal currentStock, boolean isLowStock, Boolean isDemo) {}
    @Data public static class BatchReceiveReq {
        private Long ingredientId;
        private String batchNumber;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitCost;
        private OffsetDateTime expiresAt;
        private String supplier;
    }
    @Data public static class BatchWriteOffReq {
        private Long batchId;
        private BigDecimal quantity;
        private String reason;
        private String note;
    }
    public record MenuPlanViewDto(Long id, String date, String status, List<MenuPlanItemDto> items) {}
    public record MenuPlanItemDto(Long id, Long dishId, String dishName, String category, Integer plannedPortions, Integer forecastPortions) {}
    @Data public static class MenuPlanSaveReq {
        private String date;
        private List<MenuPlanItemSaveInput> items;
    }
    @Data public static class MenuPlanItemSaveInput {
        private Long dishId;
        private Integer plannedPortions;
        private Integer forecastPortions;
    }
    public record ForecastViewDto(Long id, String date, int totalPredictedPortions, String modelVersion, String explanation, List<ForecastLineDto> lines) {}
    public record ForecastLineDto(Long id, Long dishId, String dishName, String category, int predictedPortions, int lowerBound, int upperBound, BigDecimal confidenceScore, String explanation) {}
    @Data public static class ForecastCalculateReq {
        private String date;
        private Integer expectedStudents;
        private BigDecimal participationRate;
    }
    public record ProcurementPlanViewDto(Long id, String date, String status, BigDecimal totalEstimatedCost, List<ProcurementLineDto> lines) {}
    public record ProcurementLineDto(Long id, Long ingredientId, String ingredientName, BigDecimal requiredQty, BigDecimal stockQty, BigDecimal safetyStock, BigDecimal purchaseQty, String unit, BigDecimal estimatedUnitCost, BigDecimal estimatedTotalCost) {}
    @Data public static class ProcurementCalcReq {
        private String date;
        private Long forecastRunId;
    }
    public record WasteSummaryDto(List<ProductionFactDto> productionFacts, List<WasteRecordDto> wasteRecords) {}
    public record ProductionFactDto(Long id, String date, Long dishId, String dishName, int preparedPortions, int servedPortions, int usableLeftovers, int wastePortions, String varianceNote) {}
    public record WasteRecordDto(Long id, String date, String itemName, BigDecimal quantity, String unit, String reason, BigDecimal unitCost, BigDecimal totalLoss) {}
    @Data public static class ProductionFactReq {
        private String date;
        private Long dishId;
        private int preparedPortions;
        private int servedPortions;
        private int usableLeftovers;
        private int wastePortions;
        private String varianceNote;
    }
    @Data public static class WasteRecordReq {
        private String date;
        private Long ingredientId;
        private Long dishId;
        private BigDecimal quantity;
        private String unit;
        private String reason;
    }
}
