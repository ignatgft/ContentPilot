package com.contentpilot.analytics;

import com.contentpilot.post.Post;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "post_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnore
    private Post post;

    @Column(nullable = false)
    @Builder.Default
    private Integer views = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer reactions = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer clicks = 0;

    @Column(name = "collected_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime collectedAt = OffsetDateTime.now();
}
