package com.contentpilot.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

/** Per-user settings that must stay in sync between web and mobile clients. */
@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false, length = 8)
    @Builder.Default
    private String language = "ru";

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String timezone = "Asia/Bishkek";

    @Column(name = "notify_publish_failed", nullable = false)
    @Builder.Default
    private Boolean notifyPublishFailed = true;

    @Column(name = "notify_generation_completed", nullable = false)
    @Builder.Default
    private Boolean notifyGenerationCompleted = true;

    @Column(name = "notify_review_required", nullable = false)
    @Builder.Default
    private Boolean notifyReviewRequired = true;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();
}
