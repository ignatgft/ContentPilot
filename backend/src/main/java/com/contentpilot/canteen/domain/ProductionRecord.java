package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "production_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "dish_id", nullable = false)
    private Long dishId;

    @Column(name = "prepared_portions", nullable = false)
    private Integer preparedPortions;

    @Column(name = "served_portions", nullable = false)
    private Integer servedPortions;

    @Column(name = "usable_leftovers", nullable = false)
    @Builder.Default
    private Integer usableLeftovers = 0;

    @Column(name = "waste_portions", nullable = false)
    @Builder.Default
    private Integer wastePortions = 0;

    @Column(name = "variance_note", columnDefinition = "text")
    private String varianceNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
