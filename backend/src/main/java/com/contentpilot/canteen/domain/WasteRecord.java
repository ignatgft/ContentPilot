package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "waste_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WasteRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "ingredient_id")
    private Long ingredientId;

    @Column(name = "dish_id")
    private Long dishId;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(nullable = false, length = 100)
    private String reason; // EXPIRED, SPOILED, PREPARATION_WASTE, PLATE_WASTE, OVERCOOKED, STORAGE_FAILURE

    @Column(name = "unit_cost_snapshot", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitCostSnapshot;

    @Column(name = "total_loss", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalLoss;

    @Column(name = "is_demo", nullable = false)
    @Builder.Default
    private Boolean isDemo = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
