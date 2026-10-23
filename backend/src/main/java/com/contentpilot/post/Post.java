package com.contentpilot.post;

import com.contentpilot.campaign.Campaign;
import com.contentpilot.verification.VerificationResult;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    @JsonIgnore
    private Campaign campaign;

    @Column(nullable = false, length = 50)
    private String platform; // TELEGRAM, VK, INSTAGRAM, TIKTOK, YOUTUBE

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(name = "media_url", length = 1024)
    private String mediaUrl;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "DRAFT"; // DRAFT, NEEDS_REVIEW, SCHEDULED, PUBLISHING, PUBLISHED, FAILED, PAUSED

    @Column(name = "scheduled_at")
    private OffsetDateTime scheduledAt;

    @Column(name = "published_at")
    private OffsetDateTime publishedAt;

    @Column(columnDefinition = "TEXT")
    private String error;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<VerificationResult> verificationResults = new ArrayList<>();
}
