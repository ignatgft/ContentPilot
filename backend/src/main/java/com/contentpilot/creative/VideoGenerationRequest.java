package com.contentpilot.creative;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoGenerationRequest {
    private String prompt;
    private String aspectRatio; // 9:16, 1:1, 16:9
    private int durationSeconds; // 5, 8, 10
    private String style;
    private String cameraMotion; // SLOW_ZOOM_IN, PAN_RIGHT, STATIC, DYNAMIC
    private String referenceImageUrl;
    private String brandName;
    private String badgeText;
    private String price;
}
