package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "attendance_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendancePlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "meal_period", nullable = false, length = 50)
    @Builder.Default
    private String mealPeriod = "LUNCH";

    @Column(name = "expected_students", nullable = false)
    private Integer expectedStudents;

    @Column(name = "participation_rate", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal participationRate = new BigDecimal("85.00");

    @Column(length = 50)
    @Builder.Default
    private String source = "MANUAL";

    @Column(name = "is_demo", nullable = false)
    @Builder.Default
    private Boolean isDemo = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
