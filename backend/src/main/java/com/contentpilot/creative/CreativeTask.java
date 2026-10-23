package com.contentpilot.creative;

import com.contentpilot.auth.User;
import com.contentpilot.brand.Brand;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "creative_tasks")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreativeTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private CreativeType type;

    @Column(nullable = false, length = 100)
    private String provider;

    @Column(length = 100)
    private String model;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "aspect_ratio", nullable = false, length = 20)
    @Builder.Default
    private String aspectRatio = "1:1";

    @Column(length = 100)
    private String style;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CreativeTaskStatus status = CreativeTaskStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private int progress = 0;

    @Column(name = "result_url", columnDefinition = "TEXT")
    private String resultUrl;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parameters", columnDefinition = "jsonb")
    private String parameters;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
