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
public class ClaudeTextProvider implements TextGenerationProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.claude-api-key:${app.claude.api-key:}}")
    private String apiKey;

    @Value("${app.ai.claude-model:claude-3-5-sonnet-20241022}")
    private String modelName;

    @Override
    public String getProviderName() {
        return "claude";
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("your-");
    }

    @Override
    public List<ClaudeGenerationService.GeneratedPost> generateCampaignPosts(Brand brand, String goal, int durationDays) {
        if (!isAvailable()) {
            throw new IllegalStateException("Anthropic Claude API ключ не настроен. Укажите CLAUDE_API_KEY в переменных окружения.");
        }

        String systemPrompt = """
                Ты — экспертный ИИ-маркетолог для малого бизнеса (кофейни и локальные бренды).
                Сгенерируй маркетинговую кампанию на основе профиля бренда и заданной цели.
                Твой ответ ДОЛЖЕН быть строго валидным JSON-массивом объектов без лишней разметки:
                [
                  {
                    "platform": "TELEGRAM",
                    "text": "Текст публикации...",
                    "dayOffset": 0
                  }
                ]
                Включи 4-5 постов для площадок TELEGRAM, VK, INSTAGRAM.
                """;

        String userPrompt = String.format("""
                Бренд: %s
                Описание: %s
                Аудитория: %s
                Тональность: %s
                Факты и меню: %s
                Цель кампании: %s
                Срок: %d дней
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
                "model", modelName,
                "max_tokens", 2048,
                "system", systemPrompt,
                "messages", List.of(
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        try {
            String responseJson = restClient.post()
                    .uri("https://api.anthropic.com/v1/messages")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseJson);
            String textContent = root.path("content").get(0).path("text").asText();

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
            throw new RuntimeException("Не удалось извлечь структурированный JSON контент-плана из ответа Claude");
        } catch (Exception e) {
            log.error("Error executing Claude generation: {}", e.getMessage());
            throw new RuntimeException("Ошибка генерации через Claude API: " + e.getMessage(), e);
        }
    }
}
