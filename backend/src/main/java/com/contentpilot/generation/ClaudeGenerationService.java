package com.contentpilot.generation;

import com.contentpilot.brand.Brand;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Slf4j
@Service
public class ClaudeGenerationService {

    private final List<TextGenerationProvider> providers;
    private final FallbackTextProvider fallbackProvider;

    @Value("${app.ai.text-provider:gemini}")
    private String configuredProviderName;

    @Value("${app.demo-mode-enabled:false}")
    private boolean demoModeEnabled;

    @Autowired
    public ClaudeGenerationService(List<TextGenerationProvider> providers, FallbackTextProvider fallbackProvider) {
        this.providers = providers;
        this.fallbackProvider = fallbackProvider;
    }

    // Secondary constructor for standalone testing
    public ClaudeGenerationService(RestClient restClient, ObjectMapper objectMapper) {
        this.fallbackProvider = new FallbackTextProvider(objectMapper);
        this.providers = List.of(
                new ClaudeTextProvider(restClient, objectMapper),
                new GeminiTextProvider(restClient, objectMapper),
                new OllamaTextProvider(restClient, objectMapper),
                this.fallbackProvider
        );
        this.configuredProviderName = "fallback";
        this.demoModeEnabled = true;
    }

    @Data
    @Builder
    public static class GeneratedPost {
        private String platform;
        private String text;
        private String mediaUrl;
        private int dayOffset;
    }

    public List<GeneratedPost> generateCampaignPosts(Brand brand, String goal, int durationDays) {
        String targetProvider = configuredProviderName != null ? configuredProviderName.trim().toLowerCase() : "gemini";

        TextGenerationProvider selected = providers.stream()
                .filter(p -> p.getProviderName().equalsIgnoreCase(targetProvider))
                .findFirst()
                .orElse(null);

        if (selected != null && selected.isAvailable()) {
            try {
                log.info("Generating campaign via primary AI text provider: {}", selected.getProviderName());
                return selected.generateCampaignPosts(brand, goal, durationDays);
            } catch (Exception e) {
                log.warn("Primary AI provider '{}' failed: {}. Evaluating fallback...", selected.getProviderName(), e.getMessage());
                if (!demoModeEnabled) {
                    throw new IllegalStateException("Ошибка генерации AI через '" + selected.getProviderName() + "': " + e.getMessage(), e);
                }
            }
        }

        // Try any other available cloud provider before fallback
        for (TextGenerationProvider provider : providers) {
            if (!provider.getProviderName().equalsIgnoreCase("fallback") && provider.isAvailable()) {
                try {
                    log.info("Attempting backup available provider: {}", provider.getProviderName());
                    return provider.generateCampaignPosts(brand, goal, durationDays);
                } catch (Exception e) {
                    log.warn("Backup provider '{}' also failed: {}", provider.getProviderName(), e.getMessage());
                }
            }
        }

        // Check demo mode permission for fallback
        if (demoModeEnabled || "fallback".equalsIgnoreCase(targetProvider)) {
            log.info("Using Brand Memory generator in demo mode (DEMO_MODE_ENABLED=true)");
            return fallbackProvider.generateCampaignPosts(brand, goal, durationDays);
        }

        throw new IllegalStateException(String.format(
                "AI-провайдер '%s' не настроен или недоступен. Укажите API-ключ в переменных окружения (GEMINI_API_KEY, CLAUDE_API_KEY) или включите DEMO_MODE_ENABLED=true для презентационного режима.",
                targetProvider
        ));
    }
}
