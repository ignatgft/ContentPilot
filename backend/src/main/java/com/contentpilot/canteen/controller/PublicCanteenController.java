package com.contentpilot.canteen.controller;

import com.contentpilot.canteen.domain.*;
import com.contentpilot.canteen.repository.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/{schoolSlug}")
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PublicCanteenController {

    private final SchoolRepository schoolRepository;
    private final DishRepository dishRepository;
    private final MenuPlanRepository menuPlanRepository;
    private final MenuPlanItemRepository menuPlanItemRepository;
    private final StudentPreferenceRepository preferenceRepository;
    private final AllergenRepository allergenRepository;

    // --- DTOs for Safe Public Viewing (Zero-PII, No purchase prices, No internal costs) ---
    public record PublicSchoolInfoDto(
            String name,
            String slug,
            String address,
            String currency,
            String timezone,
            boolean isMenuPublished,
            boolean allergensVisible
    ) {}

    public record PublicDishDto(
            Long id,
            String name,
            String category,
            String description,
            String imageUrl,
            Integer calories,
            BigDecimal proteins,
            BigDecimal fats,
            BigDecimal carbs,
            List<PublicAllergenDto> allergens,
            long votesCount,
            boolean userVoted
    ) {}

    public record PublicAllergenDto(
            Long id,
            String code,
            String name,
            String icon,
            String description
    ) {}

    public record PublicDailyMenuDto(
            String date,
            String dayOfWeek,
            String status,
            List<PublicDishDto> dishes
    ) {}

    @Data
    public static class PreferenceVoteReq {
        private Long dishId;
        private String date;
        private String sessionId;
    }

    private School getSchoolBySlug(String slug) {
        return schoolRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Школа с идентификатором '" + slug + "' не найдена"));
    }

    // 1. School Info
    @GetMapping("/info")
    public ResponseEntity<PublicSchoolInfoDto> getSchoolInfo(@PathVariable String schoolSlug) {
        School school = getSchoolBySlug(schoolSlug);
        return ResponseEntity.ok(new PublicSchoolInfoDto(
                school.getName(),
                school.getSlug(),
                school.getAddress(),
                school.getCurrency(),
                school.getTimezone(),
                Boolean.TRUE.equals(school.getIsMenuPublished()),
                Boolean.TRUE.equals(school.getAllergensVisible())
        ));
    }

    // 2. Menu Today
    @GetMapping("/menu/today")
    public ResponseEntity<PublicDailyMenuDto> getTodayMenu(
            @PathVariable String schoolSlug,
            @RequestParam(required = false) String sessionId) {
        School school = getSchoolBySlug(schoolSlug);
        LocalDate today = LocalDate.now();
        return ResponseEntity.ok(buildPublicMenuForDate(school, today, sessionId));
    }

    // 3. Menu for Week (Next 6 days)
    @GetMapping("/menu/week")
    public ResponseEntity<List<PublicDailyMenuDto>> getWeekMenu(
            @PathVariable String schoolSlug,
            @RequestParam(required = false) String sessionId) {
        School school = getSchoolBySlug(schoolSlug);
        LocalDate start = LocalDate.now();

        List<PublicDailyMenuDto> weekMenu = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            LocalDate d = start.plusDays(i);
            weekMenu.add(buildPublicMenuForDate(school, d, sessionId));
        }

        return ResponseEntity.ok(weekMenu);
    }

    // 4. Dish Details (with strict cross-school protection)
    @GetMapping("/dishes/{dishId}")
    public ResponseEntity<PublicDishDto> getDishDetails(
            @PathVariable String schoolSlug,
            @PathVariable Long dishId,
            @RequestParam(required = false) String sessionId) {
        School school = getSchoolBySlug(schoolSlug);
        Dish dish = dishRepository.findById(dishId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Блюдо #" + dishId + " не найдено"));

        // School boundary security: verify dish belongs to this school
        if (!dish.getSchoolId().equals(school.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Доступ запрещен: блюдо относится к другой школе");
        }

        return ResponseEntity.ok(mapToPublicDish(dish, LocalDate.now(), sessionId, school.getId()));
    }

    // 5. Anonymous Student Preference Vote (Zero PII, 1-click meal choice)
    @PostMapping("/preferences")
    @Transactional
    public ResponseEntity<Map<String, Object>> votePreference(
            @PathVariable String schoolSlug,
            @RequestBody PreferenceVoteReq req) {
        School school = getSchoolBySlug(schoolSlug);

        if (req.getDishId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Не указан dishId");
        }
        String sid = (req.getSessionId() != null && !req.getSessionId().isBlank())
                ? req.getSessionId().trim()
                : UUID.randomUUID().toString();
        LocalDate serviceDate = (req.getDate() != null && !req.getDate().isBlank())
                ? LocalDate.parse(req.getDate())
                : LocalDate.now();

        Dish dish = dishRepository.findById(req.getDishId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Блюдо не найдено"));

        if (!dish.getSchoolId().equals(school.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Блюдо относится к другой школе");
        }

        Optional<StudentPreference> existing = preferenceRepository.findBySchoolIdAndServiceDateAndSessionIdAndDishId(
                school.getId(), serviceDate, sid, dish.getId()
        );

        boolean voted;
        if (existing.isPresent()) {
            preferenceRepository.delete(existing.get());
            voted = false;
        } else {
            StudentPreference pref = StudentPreference.builder()
                    .schoolId(school.getId())
                    .serviceDate(serviceDate)
                    .dishId(dish.getId())
                    .sessionId(sid)
                    .build();
            preferenceRepository.save(pref);
            voted = true;
        }

        long count = preferenceRepository.countBySchoolIdAndServiceDateAndDishId(school.getId(), serviceDate, dish.getId());

        return ResponseEntity.ok(Map.of(
                "dishId", dish.getId(),
                "voted", voted,
                "votesCount", count,
                "sessionId", sid
        ));
    }

    private PublicDailyMenuDto buildPublicMenuForDate(School school, LocalDate date, String sessionId) {
        if (!Boolean.TRUE.equals(school.getIsMenuPublished())) {
            return new PublicDailyMenuDto(date.toString(), formatDayOfWeek(date), "NOT_PUBLISHED", Collections.emptyList());
        }

        Optional<MenuPlan> menuPlanOpt = menuPlanRepository.findBySchoolIdAndServiceDateAndMealPeriod(
                school.getId(), date, "LUNCH"
        );

        List<PublicDishDto> dishesList = new ArrayList<>();

        if (menuPlanOpt.isPresent()) {
            MenuPlan plan = menuPlanOpt.get();
            List<MenuPlanItem> items = menuPlanItemRepository.findByMenuPlanId(plan.getId());
            for (MenuPlanItem item : items) {
                dishRepository.findById(item.getDishId()).ifPresent(dish -> {
                    dishesList.add(mapToPublicDish(dish, date, sessionId, school.getId()));
                });
            }
        } else {
            // If specific plan not generated, show active standard dishes for school
            List<Dish> activeDishes = dishRepository.findBySchoolIdAndActiveTrue(school.getId());
            for (Dish dish : activeDishes) {
                dishesList.add(mapToPublicDish(dish, date, sessionId, school.getId()));
            }
        }

        return new PublicDailyMenuDto(
                date.toString(),
                formatDayOfWeek(date),
                menuPlanOpt.map(MenuPlan::getStatus).orElse("APPROVED"),
                dishesList
        );
    }

    private PublicDishDto mapToPublicDish(Dish dish, LocalDate date, String sessionId, Long schoolId) {
        List<PublicAllergenDto> allergenDtos = dish.getAllergens().stream()
                .map(a -> new PublicAllergenDto(a.getId(), a.getCode(), a.getName(), a.getIcon(), a.getDescription()))
                .collect(Collectors.toList());

        long votes = preferenceRepository.countBySchoolIdAndServiceDateAndDishId(schoolId, date, dish.getId());
        boolean userVoted = false;
        if (sessionId != null && !sessionId.isBlank()) {
            userVoted = preferenceRepository.findBySchoolIdAndServiceDateAndSessionIdAndDishId(
                    schoolId, date, sessionId.trim(), dish.getId()
            ).isPresent();
        }

        return new PublicDishDto(
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
                votes,
                userVoted
        );
    }

    private String formatDayOfWeek(LocalDate date) {
        return switch (date.getDayOfWeek()) {
            case MONDAY -> "Понедельник";
            case TUESDAY -> "Вторник";
            case WEDNESDAY -> "Среда";
            case THURSDAY -> "Четверг";
            case FRIDAY -> "Пятница";
            case SATURDAY -> "Суббота";
            case SUNDAY -> "Воскресенье";
        };
    }
}
