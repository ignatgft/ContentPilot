package com.contentpilot.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class AnalyticsDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PostMetricDetail {
        private Long postId;
        private String platform;
        private String text;
        private int views;
        private int reactions;
        private int clicks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OverviewResponse {
        private int totalPosts;
        private int publishedPosts;
        private int totalViews;
        private int totalReactions;
        private int totalClicks;
        private boolean hasData;
        private String summaryMessage;
        private List<String> recommendations;
        private List<PostMetricDetail> topPosts;
    }
}
