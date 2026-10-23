package com.contentpilot.generation;

import com.contentpilot.brand.Brand;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OllamaTextProvider implements TextGenerationProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.ollama-base-url:http://localhost:11434}")
    private String baseUrl;

    @Value("${app.ai.ollama-model:llama3.2}")
    private String modelName;

    @Override
    public String getProviderName() {
        return "ollama";
    }

    @Override
    public boolean isAvailable() {
        try {
            String check = restClient.get()
                    .uri(baseUrl + "/api/tags")
                    .retrieve()
                    .body(String.class);
            return check != null && check.contains("models");
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<ClaudeGenerationService.GeneratedPost> generateCampaignPosts(Brand brand, String goal, int durationDays) {
        String prompt = String.format("""
                Ты — ИИ-маркетолог для малого бизнеса.
                Сгенерируй строго JSON-массив из 4 постов для соцсетей TELEGRAM, VK, INSTAGRAM:
                [
                  {
                    "platform": "TELEGRAM",
                    "text": "Текст публикации...",
                    "dayOffset": 0
                  }
                ]

                Бренд: %s, Меню и цены: %s, Цель: %s
                """,
                brand.getName(),
                brand.getFacts(),
                goal
        );

        Map<String, Object> body = Map.of(
                "model", modelName,
                "prompt", prompt,
                "format", "json",
                "stream", false
        );

        try {
            String responseJson = restClient.post()
                    .uri(baseUrl + "/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseJson);
            String responseText = root.path("response").asText();

            int start = responseText.indexOf('[');
            int end = responseText.lastIndexOf(']');
            if (start != -1 && end != -1) {
                String arrayJson = responseText.substring(start, end + 1);
                JsonNode arrayNode = objectMapper.readTree(arrayJson);
                List<ClaudeGenerationService.GeneratedPost> posts = new ArrayList<>();
                for (JsonNode item : arrayNode) {
                    posts.add(ClaudeGenerationService.GeneratedPost.builder()
                            .platform(item.path("platform").asText("TELEGRAM"))
                            .text(item.path("text").asText())
                            .dayOffset(item.path("dayOffset").asInt(0))
                            .build());
                }
                if (!posts.isEmpty()) {
                    return posts;
                }
            }
            throw new RuntimeException("Не удалось извлечь массив контент-плана из ответа Ollama");
        } catch (Exception e) {
            log.error("Error executing Ollama text generation: {}", e.getMessage());
            throw new RuntimeException("Ошибка локального Ollama: " + e.getMessage(), e);
        }
    }
}
