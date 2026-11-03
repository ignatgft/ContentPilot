package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "student_meal_bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentMealBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "student_name", nullable = false, length = 120)
    private String studentName;

    @Column(nullable = false, length = 20)
    private String grade;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "meal_type", nullable = false, length = 50)
    @Builder.Default
    private String mealType = "LUNCH";

    @Column(name = "dish_id")
    private Long dishId;

    @Column(name = "dietary_notes", length = 255)
    private String dietaryNotes;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = new BigDecimal("75.00");

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "CONFIRMED"; // CONFIRMED, SERVED, CANCELLED

    @Column(name = "served_at")
    private OffsetDateTime servedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "is_demo", nullable = false)
    @Builder.Default
    private Boolean isDemo = true;
}
