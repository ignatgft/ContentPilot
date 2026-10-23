package com.contentpilot.generation;

import com.contentpilot.brand.Brand;

import java.util.List;

public interface TextGenerationProvider {
    String getProviderName();
    boolean isAvailable();
    List<ClaudeGenerationService.GeneratedPost> generateCampaignPosts(Brand brand, String goal, int durationDays);
}
