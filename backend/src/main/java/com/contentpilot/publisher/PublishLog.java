package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "publish_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublishLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    @JsonIgnore
    private Post post;

    @Column(nullable = false)
    @Builder.Default
    private Integer attempt = 1;

    @Column(nullable = false, length = 50)
    private String result; // SUCCESS, FAILED, RETRY

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
