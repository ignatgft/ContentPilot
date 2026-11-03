package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "procurement_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcurementLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "procurement_plan_id", nullable = false)
    private Long procurementPlanId;

    @Column(name = "ingredient_id", nullable = false)
    private Long ingredientId;

    @Column(name = "required_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal requiredQty;

    @Column(name = "stock_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal stockQty;

    @Column(name = "safety_stock", nullable = false, precision = 14, scale = 3)
    @Builder.Default
    private BigDecimal safetyStock = BigDecimal.ZERO;

    @Column(name = "purchase_qty", nullable = false, precision = 14, scale = 3)
    private BigDecimal purchaseQty;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "estimated_unit_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal estimatedUnitCost = BigDecimal.ZERO;

    @Column(name = "estimated_total_cost", nullable = false, precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal estimatedTotalCost = BigDecimal.ZERO;
}
