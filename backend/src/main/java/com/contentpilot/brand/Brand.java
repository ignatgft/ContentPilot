package com.contentpilot.brand;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "brands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String audience;

    @Column(length = 100)
    private String tone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "facts", columnDefinition = "jsonb")
    private String facts;

    @Column(name = "autonomy_mode", nullable = false)
    @Builder.Default
    private String autonomyMode = "MANUAL"; // MANUAL, SEMI_AUTO, AUTOPILOT

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "brand", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BrandSample> samples = new ArrayList<>();
}
