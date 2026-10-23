package com.contentpilot.creative;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoGenerationResult {
    private byte[] videoBytes;
    private byte[] thumbnailBytes;
    private String mimeType;
    private int width;
    private int height;
    private int durationSeconds;
    private String providerName;
    private String modelName;
    private String remoteUrl;
}
