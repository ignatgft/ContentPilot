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
public class GeminiTextProvider implements TextGenerationProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.gemini-api-key:}")
    private String apiKey;

    @Value("${app.ai.text-model:gemini-2.5-flash}")
    private String modelName;

    @Override
    public String getProviderName() {
        return "gemini";
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("your-");
    }

    @Override
    public List<ClaudeGenerationService.GeneratedPost> generateCampaignPosts(Brand brand, String goal, int durationDays) {
        if (!isAvailable()) {
            throw new IllegalStateException("Google Gemini API ключ не настроен. Укажите GEMINI_API_KEY в переменных окружения.");
        }

        String prompt = String.format("""
                Ты — профессиональный ИИ-маркетолог для локального бизнеса.
                Сгенерируй маркетинговый контент-план из 4-5 постов для соцсетей (TELEGRAM, VK, INSTAGRAM).
                Твой ответ ДОЛЖЕН быть строго валидным JSON-массивом объектов:
                [
                  {
                    "platform": "TELEGRAM",
                    "text": "Текст поста с эмодзи и призывом к действию",
                    "dayOffset": 0
                  }
                ]

                Данные бренда:
                - Название: %s
                - Описание: %s
                - Аудитория: %s
                - Тональность: %s
                - Факты и меню: %s
                - Маркетинговая цель: %s
                - Длительность: %d дней
                """,
                brand.getName(),
                brand.getDescription(),
                brand.getAudience(),
                brand.getTone(),
                brand.getFacts(),
                goal,
                durationDays
        );

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "responseMimeType", "application/json"
                )
        );

        String uri = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                modelName != null && !modelName.isBlank() ? modelName : "gemini-2.5-flash", apiKey);

        try {
            String responseJson = restClient.post()
                    .uri(uri)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode textCandidate = root.path("candidates").get(0).path("content").path("parts").get(0).path("text");
            String textContent = textCandidate.asText();

            int start = textContent.indexOf('[');
            int end = textContent.lastIndexOf(']');
            if (start != -1 && end != -1) {
                String arrayJson = textContent.substring(start, end + 1);
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
            throw new RuntimeException("Не удалось извлечь массив публикаций из ответа Gemini API");
        } catch (Exception e) {
            log.error("Error executing Gemini text generation: {}", e.getMessage());
            throw new RuntimeException("Ошибка генерации через Google Gemini API: " + e.getMessage(), e);
        }
    }
}
