package com.contentpilot.creative;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

public class CreativeDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateImageRequest {
        private String prompt;
        private String style; // MINIMALIST, COFFEE_AESTHETIC, STUDIO_COMMERCIAL, VIBRANT_POP, DARK_LUXURY
        private String aspectRatio; // 1:1, 9:16, 16:9, 4:5
        private String goal;
        private String referenceImageUrl;
        
        // Deterministic overlay parameters
        private boolean enableOverlay;
        private String brandName;
        private String price;
        private String badgeText;
        private String ctaText;
        private String overlayPosition; // BOTTOM_LEFT, BOTTOM_RIGHT, BOTTOM_CENTER, TOP_LEFT
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateVideoRequest {
        private String prompt;
        private String style;
        private String aspectRatio; // 9:16 (Shorts/Reels), 1:1, 16:9
        private int durationSeconds; // 5, 8, 10
        private String cameraMotion; // SLOW_ZOOM_IN, PAN_RIGHT, STATIC, DYNAMIC
        private String referenceImageUrl;
        
        // Overlay for video
        private boolean enableOverlay;
        private String badgeText;
        private String price;
        private String brandName;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreativeTaskResponse {
        private Long id;
        private CreativeType type;
        private String provider;
        private String model;
        private String prompt;
        private String aspectRatio;
        private String style;
        private CreativeTaskStatus status;
        private int progress;
        private String resultUrl;
        private String errorMessage;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MediaAssetResponse {
        private Long id;
        private Long taskId;
        private CreativeType mediaType;
        private String url;
        private String thumbnailUrl;
        private String prompt;
        private String style;
        private String aspectRatio;
        private Integer width;
        private Integer height;
        private Integer durationSeconds;
        private Instant createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachToPostRequest {
        private Long postId; // Optional: update existing post
        private Long campaignId; // Optional: attach to specific campaign
        private String platform; // TELEGRAM, VK, INSTAGRAM, YOUTUBE, TIKTOK
        private String postText; // Optional: custom caption or generated default
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreativePreset {
        private String id;
        private String title;
        private String description;
        private String prompt;
        private String style;
        private String defaultAspectRatio;
        private String suggestedBadge;
        private String suggestedCta;
        private String category;
    }
}
