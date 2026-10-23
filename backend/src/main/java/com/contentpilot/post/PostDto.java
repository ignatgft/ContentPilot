package com.contentpilot.post;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.List;

public class PostDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UpdateRequest {
        private String text;
        private String platform;
        private String mediaUrl;
        private OffsetDateTime scheduledAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VerificationResponse {
        private Long id;
        private String checkType;
        private String status;
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long campaignId;
        private String platform;
        private String text;
        private String mediaUrl;
        private String status;
        private OffsetDateTime scheduledAt;
        private OffsetDateTime publishedAt;
        private String error;
        private OffsetDateTime createdAt;
        private List<VerificationResponse> verificationResults;
    }
}
