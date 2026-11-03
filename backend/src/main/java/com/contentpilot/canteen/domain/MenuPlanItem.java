package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "menu_plan_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "menu_plan_id", nullable = false)
    private Long menuPlanId;

    @Column(name = "dish_id", nullable = false)
    private Long dishId;

    @Column(name = "planned_portions", nullable = false)
    private Integer plannedPortions;

    @Column(name = "forecast_portions")
    private Integer forecastPortions;
}
