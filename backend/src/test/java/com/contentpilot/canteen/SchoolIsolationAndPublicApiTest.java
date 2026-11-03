package com.contentpilot.canteen;

import com.contentpilot.canteen.controller.PublicCanteenController;
import com.contentpilot.canteen.domain.Allergen;
import com.contentpilot.canteen.domain.Dish;
import com.contentpilot.canteen.domain.School;
import com.contentpilot.canteen.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class SchoolIsolationAndPublicApiTest {

    private SchoolRepository schoolRepository;
    private DishRepository dishRepository;
    private MenuPlanRepository menuPlanRepository;
    private MenuPlanItemRepository menuPlanItemRepository;
    private StudentPreferenceRepository preferenceRepository;
    private AllergenRepository allergenRepository;
    private PublicCanteenController publicController;

    private School school24;
    private Dish pilafDish;

    @BeforeEach
    void setUp() {
        schoolRepository = Mockito.mock(SchoolRepository.class);
        dishRepository = Mockito.mock(DishRepository.class);
        menuPlanRepository = Mockito.mock(MenuPlanRepository.class);
        menuPlanItemRepository = Mockito.mock(MenuPlanItemRepository.class);
        preferenceRepository = Mockito.mock(StudentPreferenceRepository.class);
        allergenRepository = Mockito.mock(AllergenRepository.class);

        publicController = new PublicCanteenController(
                schoolRepository,
                dishRepository,
                menuPlanRepository,
                menuPlanItemRepository,
                preferenceRepository,
                allergenRepository
        );

        school24 = School.builder()
                .id(1L)
                .name("Школа-гимназия №24 г. Бишкек")
                .slug("school-24")
                .address("ул. Тыныстанова, 110")
                .currency("KGS")
                .timezone("Asia/Bishkek")
                .totalStudents(650)
                .isMenuPublished(true)
                .allergensVisible(true)
                .build();

        Allergen gluten = Allergen.builder().id(1L).code("GLUTEN").name("Глютен").icon("wheat").build();

        pilafDish = Dish.builder()
                .id(10L)
                .schoolId(1L)
                .name("Плов с говядиной")
                .category("Горячие блюда")
                .description("Традиционный плов с желтой морковью")
                .imageUrl("https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8")
                .calories(520)
                .proteins(new BigDecimal("18.5"))
                .fats(new BigDecimal("16.0"))
                .carbs(new BigDecimal("65.0"))
                .allergens(Set.of(gluten))
                .active(true)
                .build();
    }

    @Test
    void testPublicSchoolInfoDoesNotExposeInternalSecrets() {
        when(schoolRepository.findBySlug("school-24")).thenReturn(Optional.of(school24));

        ResponseEntity<PublicCanteenController.PublicSchoolInfoDto> response = publicController.getSchoolInfo("school-24");

        assertNotNull(response.getBody());
        assertEquals("Школа-гимназия №24 г. Бишкек", response.getBody().name());
        assertEquals("school-24", response.getBody().slug());
        assertTrue(response.getBody().isMenuPublished());
    }

    @Test
    void testCrossSchoolProtectionRejectsDishFromAnotherSchool() {
        when(schoolRepository.findBySlug("school-24")).thenReturn(Optional.of(school24));

        // Dish belonging to School #55 (id = 55)
        Dish foreignDish = Dish.builder()
                .id(999L)
                .schoolId(55L)
                .name("Чужое блюдо")
                .build();

        when(dishRepository.findById(999L)).thenReturn(Optional.of(foreignDish));

        // Attempting to access foreign dish via school-24 URL must throw 403 Forbidden!
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            publicController.getDishDetails("school-24", 999L, null);
        });

        assertEquals(403, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("другой школе"));
    }

    @Test
    void testAnonymousStudentPreferenceVote() {
        when(schoolRepository.findBySlug("school-24")).thenReturn(Optional.of(school24));
        when(dishRepository.findById(10L)).thenReturn(Optional.of(pilafDish));
        when(preferenceRepository.findBySchoolIdAndServiceDateAndSessionIdAndDishId(eq(1L), any(), any(), eq(10L)))
                .thenReturn(Optional.empty());
        when(preferenceRepository.countBySchoolIdAndServiceDateAndDishId(eq(1L), any(), eq(10L)))
                .thenReturn(15L);

        PublicCanteenController.PreferenceVoteReq req = new PublicCanteenController.PreferenceVoteReq();
        req.setDishId(10L);
        req.setDate(LocalDate.now().toString());
        req.setSessionId("browser-uuid-1234");

        ResponseEntity<Map<String, Object>> response = publicController.votePreference("school-24", req);

        assertNotNull(response.getBody());
        assertTrue((Boolean) response.getBody().get("voted"));
        assertEquals(15L, response.getBody().get("votesCount"));
    }
}
