package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "procurement_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcurementPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "forecast_run_id")
    private Long forecastRunId;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "CALCULATED"; // CALCULATED, ORDERED, RECEIVED

    @Column(name = "total_estimated_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalEstimatedCost = BigDecimal.ZERO;

    @Column(name = "is_demo", nullable = false)
    @Builder.Default
    private Boolean isDemo = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
