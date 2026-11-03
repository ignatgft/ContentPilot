package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "forecast_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForecastLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "forecast_run_id", nullable = false)
    private Long forecastRunId;

    @Column(name = "dish_id", nullable = false)
    private Long dishId;

    @Column(name = "predicted_portions", nullable = false)
    private Integer predictedPortions;

    @Column(name = "lower_bound", nullable = false)
    private Integer lowerBound;

    @Column(name = "upper_bound", nullable = false)
    private Integer upperBound;

    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;

    @Column(columnDefinition = "text")
    private String explanation;
}
