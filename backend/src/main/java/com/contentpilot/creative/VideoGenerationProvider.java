package com.contentpilot.creative;

public interface VideoGenerationProvider {
    String getProviderName();
    boolean isAvailable();
    VideoGenerationResult generateVideo(VideoGenerationRequest request) throws Exception;
}
