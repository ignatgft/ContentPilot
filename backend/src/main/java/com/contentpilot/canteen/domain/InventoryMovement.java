package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "inventory_movements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ingredient_id", nullable = false)
    private Long ingredientId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "movement_type", nullable = false, length = 50)
    private String movementType; // RECEIPT, CONSUMPTION, WRITE_OFF, ADJUSTMENT

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantity;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "unit_cost", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitCost;

    @Column(name = "reference_type", length = 100)
    private String referenceType; // PRODUCTION, EXPIRED, SPOILED, MANUAL, INVENTORY_CHECK

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
