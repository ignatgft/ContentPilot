package com.contentpilot.canteen;

import com.contentpilot.canteen.domain.Dish;
import com.contentpilot.canteen.domain.StudentMealBooking;
import com.contentpilot.canteen.repository.DishRepository;
import com.contentpilot.canteen.repository.StudentMealBookingRepository;
import com.contentpilot.canteen.service.MealBookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class MealBookingServiceTest {

    private StudentMealBookingRepository bookingRepository;
    private DishRepository dishRepository;
    private MealBookingService service;

    @BeforeEach
    void setUp() {
        bookingRepository = Mockito.mock(StudentMealBookingRepository.class);
        dishRepository = Mockito.mock(DishRepository.class);
        service = new MealBookingService(bookingRepository, dishRepository);
    }

    @Test
    void testCreateBookingGeneratesCode() {
        MealBookingService.CreateBookingRequest req = new MealBookingService.CreateBookingRequest();
        req.setSchoolId(1L);
        req.setStudentName("Азамат Ибраимов");
        req.setGrade("7-Б");
        req.setBookingDate(LocalDate.of(2026, 10, 27));
        req.setMealType("LUNCH");
        req.setDishId(1L);
        req.setDietaryNotes("Без лактозы");
        req.setPrice(new BigDecimal("75.00"));

        when(bookingRepository.findByCodeIgnoreCase(any())).thenReturn(Optional.empty());
        when(dishRepository.findById(1L)).thenReturn(Optional.of(Dish.builder().id(1L).name("Плов с говядиной").build()));
        when(bookingRepository.save(any(StudentMealBooking.class))).thenAnswer(invocation -> {
            StudentMealBooking b = invocation.getArgument(0);
            b.setId(101L);
            return b;
        });

        MealBookingService.BookingResponse resp = service.createBooking(req);

        assertNotNull(resp);
        assertEquals(101L, resp.getId());
        assertEquals("Азамат Ибраимов", resp.getStudentName());
        assertEquals("7-Б", resp.getGrade());
        assertTrue(resp.getCode().startsWith("SC-"));
        assertEquals("CONFIRMED", resp.getStatus());
        assertEquals("Плов с говядиной", resp.getDishName());
    }

    @Test
    void testServeBookingByCode() {
        StudentMealBooking existing = StudentMealBooking.builder()
                .id(10L)
                .code("SC-5555")
                .status("CONFIRMED")
                .studentName("Дастан Оморов")
                .grade("4-В")
                .bookingDate(LocalDate.now())
                .price(new BigDecimal("70.00"))
                .build();

        when(bookingRepository.findByCodeIgnoreCase("SC-5555")).thenReturn(Optional.of(existing));
        when(bookingRepository.save(any(StudentMealBooking.class))).thenAnswer(inv -> inv.getArgument(0));

        MealBookingService.BookingResponse resp = service.serveBookingByCode("SC-5555");

        assertEquals("SERVED", resp.getStatus());
        assertNotNull(resp.getServedAt());
    }

    @Test
    void testCannotServeAlreadyServedBooking() {
        StudentMealBooking alreadyServed = StudentMealBooking.builder()
                .id(11L)
                .code("SC-7777")
                .status("SERVED")
                .build();

        when(bookingRepository.findByCodeIgnoreCase("SC-7777")).thenReturn(Optional.of(alreadyServed));

        assertThrows(IllegalStateException.class, () -> service.serveBookingByCode("SC-7777"));
    }

    @Test
    void testDailySummary() {
        LocalDate today = LocalDate.of(2026, 10, 27);
        List<StudentMealBooking> bookings = List.of(
                StudentMealBooking.builder().id(1L).status("CONFIRMED").price(new BigDecimal("75.00")).bookingDate(today).build(),
                StudentMealBooking.builder().id(2L).status("SERVED").price(new BigDecimal("75.00")).bookingDate(today).build(),
                StudentMealBooking.builder().id(3L).status("CANCELLED").price(new BigDecimal("70.00")).bookingDate(today).build()
        );

        when(bookingRepository.findBySchoolIdAndBookingDateOrderByCreatedAtDesc(1L, today)).thenReturn(bookings);

        MealBookingService.BookingDailySummary summary = service.getSummary(1L, today);

        assertEquals(2, summary.getTotalBooked()); // 1 CONFIRMED + 1 SERVED, excluding CANCELLED
        assertEquals(1, summary.getTotalServed());
        assertEquals(1, summary.getPendingPickup());
        assertEquals(new BigDecimal("150.00"), summary.getTotalRevenueKgs());
    }
}
