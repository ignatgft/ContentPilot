package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.OffsetDateTime;

@Entity
@Table(name = "schools")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 100, unique = true)
    private String slug;

    @Column(length = 500)
    private String address;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String currency = "KGS";

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String timezone = "Asia/Bishkek";

    @Column(name = "total_students", nullable = false)
    @Builder.Default
    private Integer totalStudents = 500;

    @Column(name = "is_menu_published", nullable = false)
    @Builder.Default
    private Boolean isMenuPublished = true;

    @Column(name = "allergens_visible", nullable = false)
    @Builder.Default
    private Boolean allergensVisible = true;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "settings", columnDefinition = "jsonb")
    private String settings;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
