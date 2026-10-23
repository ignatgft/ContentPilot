package com.contentpilot.creative;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenerationRequest {
    private String prompt;
    private String aspectRatio; // 1:1, 9:16, 16:9, 4:5
    private String style;
    private String brandName;
    private String brandTone;
    private String brandDescription;
    private List<String> brandColors;
    private String referenceImageUrl;
}
