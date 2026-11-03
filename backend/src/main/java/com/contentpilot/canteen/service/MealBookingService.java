package com.contentpilot.canteen.service;

import com.contentpilot.canteen.domain.Dish;
import com.contentpilot.canteen.domain.StudentMealBooking;
import com.contentpilot.canteen.repository.DishRepository;
import com.contentpilot.canteen.repository.StudentMealBookingRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MealBookingService {

    private final StudentMealBookingRepository bookingRepository;
    private final DishRepository dishRepository;
    private final Random random = new Random();

    @Data
    public static class CreateBookingRequest {
        private Long schoolId;
        private String studentName;
        private String grade;
        private LocalDate bookingDate;
        private String mealType;
        private Long dishId;
        private String dietaryNotes;
        private BigDecimal price;
    }

    @Data
    @Builder
    public static class BookingResponse {
        private Long id;
        private Long schoolId;
        private String studentName;
        private String grade;
        private LocalDate bookingDate;
        private String mealType;
        private Long dishId;
        private String dishName;
        private String dietaryNotes;
        private String code;
        private BigDecimal price;
        private String status;
        private OffsetDateTime servedAt;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    public static class BookingDailySummary {
        private LocalDate date;
        private long totalBooked;
        private long totalServed;
        private long pendingPickup;
        private BigDecimal totalRevenueKgs;
    }

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest req) {
        Long schoolId = req.getSchoolId() != null ? req.getSchoolId() : 1L;
        LocalDate date = req.getBookingDate() != null ? req.getBookingDate() : LocalDate.now();
        BigDecimal price = req.getPrice() != null ? req.getPrice() : new BigDecimal("75.00");

        String code = generateUniqueCode();

        StudentMealBooking booking = StudentMealBooking.builder()
                .schoolId(schoolId)
                .studentName(req.getStudentName() != null ? req.getStudentName().trim() : "Ученик")
                .grade(req.getGrade() != null ? req.getGrade().trim() : "1-А")
                .bookingDate(date)
                .mealType(req.getMealType() != null ? req.getMealType() : "LUNCH")
                .dishId(req.getDishId())
                .dietaryNotes(req.getDietaryNotes())
                .code(code)
                .price(price)
                .status("CONFIRMED")
                .isDemo(true)
                .build();

        StudentMealBooking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookings(Long schoolId, LocalDate date, String grade, String status) {
        Long sid = schoolId != null ? schoolId : 1L;
        List<StudentMealBooking> list;

        if (date != null) {
            list = bookingRepository.findBySchoolIdAndBookingDateOrderByCreatedAtDesc(sid, date);
        } else {
            list = bookingRepository.findBySchoolIdOrderByBookingDateDescCreatedAtDesc(sid);
        }

        return list.stream()
                .filter(b -> grade == null || grade.isBlank() || b.getGrade().equalsIgnoreCase(grade.trim()))
                .filter(b -> status == null || status.isBlank() || b.getStatus().equalsIgnoreCase(status.trim()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingResponse verifyCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Код талона не указан");
        }
        StudentMealBooking booking = bookingRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Бронирование по коду '" + code + "' не найдено"));
        return mapToResponse(booking);
    }

    @Transactional
    public BookingResponse serveBookingByCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Код талона не указан");
        }
        StudentMealBooking booking = bookingRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new IllegalArgumentException("Бронирование по коду '" + code + "' не найдено"));

        if ("SERVED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Порция по коду '" + code + "' уже была выдана (" + booking.getServedAt() + ")");
        }
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Бронирование по коду '" + code + "' было отменено");
        }

        booking.setStatus("SERVED");
        booking.setServedAt(OffsetDateTime.now());
        StudentMealBooking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Transactional
    public BookingResponse cancelBooking(Long id) {
        StudentMealBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Бронирование с id " + id + " не найдено"));
        if ("SERVED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalStateException("Нельзя отменить уже выданную порцию");
        }
        booking.setStatus("CANCELLED");
        StudentMealBooking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public BookingDailySummary getSummary(Long schoolId, LocalDate date) {
        Long sid = schoolId != null ? schoolId : 1L;
        LocalDate d = date != null ? date : LocalDate.now();

        List<StudentMealBooking> bookings = bookingRepository.findBySchoolIdAndBookingDateOrderByCreatedAtDesc(sid, d);

        long totalBooked = bookings.stream().filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus())).count();
        long totalServed = bookings.stream().filter(b -> "SERVED".equalsIgnoreCase(b.getStatus())).count();
        long pending = totalBooked - totalServed;

        BigDecimal totalRevenue = bookings.stream()
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                .map(StudentMealBooking::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return BookingDailySummary.builder()
                .date(d)
                .totalBooked(totalBooked)
                .totalServed(totalServed)
                .pendingPickup(pending)
                .totalRevenueKgs(totalRevenue)
                .build();
    }

    private String generateUniqueCode() {
        for (int i = 0; i < 10; i++) {
            int num = 1000 + random.nextInt(9000);
            String code = "SC-" + num;
            if (bookingRepository.findByCodeIgnoreCase(code).isEmpty()) {
                return code;
            }
        }
        return "SC-" + System.currentTimeMillis() % 100000;
    }

    private BookingResponse mapToResponse(StudentMealBooking b) {
        String dishName = "Комплексный школьный обед";
        if (b.getDishId() != null) {
            dishName = dishRepository.findById(b.getDishId())
                    .map(Dish::getName)
                    .orElse("Блюдо #" + b.getDishId());
        }

        return BookingResponse.builder()
                .id(b.getId())
                .schoolId(b.getSchoolId())
                .studentName(b.getStudentName())
                .grade(b.getGrade())
                .bookingDate(b.getBookingDate())
                .mealType(b.getMealType())
                .dishId(b.getDishId())
                .dishName(dishName)
                .dietaryNotes(b.getDietaryNotes())
                .code(b.getCode())
                .price(b.getPrice())
                .status(b.getStatus())
                .servedAt(b.getServedAt())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
