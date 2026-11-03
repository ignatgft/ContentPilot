package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "forecast_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastRun {

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

    @Column(name = "model_version", nullable = false, length = 50)
    @Builder.Default
    private String modelVersion = "SmartCanteen-Heuristic-v1";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "input_snapshot", columnDefinition = "jsonb")
    private String inputSnapshot;

    @Column(columnDefinition = "text")
    private String explanation;

    @Column(name = "is_demo", nullable = false)
    @Builder.Default
    private Boolean isDemo = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
