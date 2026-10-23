package com.contentpilot.creative;

public interface ImageGenerationProvider {
    String getProviderName();
    boolean isAvailable();
    ImageGenerationResult generateImage(ImageGenerationRequest request) throws Exception;
}
