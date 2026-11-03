package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "dishes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Dish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Column
    @Builder.Default
    private Integer calories = 350;

    @Column(precision = 6, scale = 1)
    @Builder.Default
    private BigDecimal proteins = new BigDecimal("12.0");

    @Column(precision = 6, scale = 1)
    @Builder.Default
    private BigDecimal fats = new BigDecimal("10.0");

    @Column(precision = 6, scale = 1)
    @Builder.Default
    private BigDecimal carbs = new BigDecimal("45.0");

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "is_demo", nullable = false)
    @Builder.Default
    private Boolean isDemo = false;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "dish_allergens",
            joinColumns = @JoinColumn(name = "dish_id"),
            inverseJoinColumns = @JoinColumn(name = "allergen_id")
    )
    @Builder.Default
    private Set<Allergen> allergens = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
