package com.contentpilot.creative;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageGenerationResult {
    private byte[] imageBytes;
    private String mimeType;
    private int width;
    private int height;
    private String providerName;
    private String modelName;
    private String remoteUrl;
}
