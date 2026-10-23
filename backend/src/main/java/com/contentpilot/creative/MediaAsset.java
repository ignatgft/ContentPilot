package com.contentpilot.creative;

import com.contentpilot.brand.Brand;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "media_assets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaAsset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    private Brand brand;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private CreativeTask task;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 50)
    private CreativeType mediaType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(columnDefinition = "TEXT")
    private String prompt;

    @Column(length = 100)
    private String style;

    @Column(name = "aspect_ratio", nullable = false, length = 20)
    @Builder.Default
    private String aspectRatio = "1:1";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "overlay_data", columnDefinition = "jsonb")
    private String overlayData;

    private Integer width;
    private Integer height;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
