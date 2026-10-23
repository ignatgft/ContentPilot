package com.contentpilot.brand;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class BrandDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Request {
        @NotBlank(message = "Название бренда обязательно")
        private String name;
        private String description;
        private String audience;
        private String tone;
        private Object facts; // Object or JSON string
        private String autonomyMode;
        private List<String> samples;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Response {
        private Long id;
        private Long userId;
        private String name;
        private String description;
        private String audience;
        private String tone;
        private Object facts;
        private String autonomyMode;
        private List<String> samples;
    }
}
