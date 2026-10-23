package com.contentpilot.campaign;

import com.contentpilot.post.PostDto;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public class CampaignDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        @NotBlank(message = "Цель кампании обязательна")
        private String goal;
        private LocalDate periodStart;
        private LocalDate periodEnd;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long brandId;
        private String goal;
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private String status;
        private OffsetDateTime createdAt;
        private List<PostDto.Response> posts;
    }
}
