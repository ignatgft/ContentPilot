package com.contentpilot.generation;

import com.contentpilot.brand.Brand;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClaudeGenerationService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.claude.api-key:}")
    private String claudeApiKey;

    @Data
    @Builder
    public static class GeneratedPost {
        private String platform;
        private String text;
        private String mediaUrl;
        private int dayOffset;
    }

    public List<GeneratedPost> generateCampaignPosts(Brand brand, String goal, int durationDays) {
        if (claudeApiKey != null && !claudeApiKey.isBlank() && !claudeApiKey.startsWith("your-")) {
            try {
                return callClaudeApi(brand, goal, durationDays);
            } catch (Exception e) {
                log.warn("Failed to generate campaign via Claude API, falling back to built-in generator: {}", e.getMessage());
            }
        }
        return generateFallbackPosts(brand, goal, durationDays);
    }

    private List<GeneratedPost> callClaudeApi(Brand brand, String goal, int durationDays) throws Exception {
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
                Один из постов (например для VK) сделай с описанием сезонного напитка.
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
                "model", "claude-3-5-sonnet-20241022",
                "max_tokens", 2048,
                "system", systemPrompt,
                "messages", List.of(
                        Map.of("role", "user", "content", userPrompt)
                )
        );

        String responseJson = restClient.post()
                .uri("https://api.anthropic.com/v1/messages")
                .header("x-api-key", claudeApiKey)
                .header("anthropic-version", "2023-06-01")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(responseJson);
        String textContent = root.path("content").get(0).path("text").asText();

        // Extract JSON array from response
        int start = textContent.indexOf('[');
        int end = textContent.lastIndexOf(']');
        if (start != -1 && end != -1) {
            String arrayJson = textContent.substring(start, end + 1);
            JsonNode arrayNode = objectMapper.readTree(arrayJson);
            List<GeneratedPost> posts = new ArrayList<>();
            for (JsonNode item : arrayNode) {
                posts.add(GeneratedPost.builder()
                        .platform(item.path("platform").asText("TELEGRAM"))
                        .text(item.path("text").asText())
                        .dayOffset(item.path("dayOffset").asInt(0))
                        .build());
            }
            if (!posts.isEmpty()) {
                return posts;
            }
        }
        return generateFallbackPosts(brand, goal, durationDays);
    }

    private List<GeneratedPost> generateFallbackPosts(Brand brand, String goal, int durationDays) {
        String brandName = brand.getName() != null ? brand.getName() : "Coffee Point";
        List<GeneratedPost> posts = new ArrayList<>();

        // Post 1: Announcement (Telegram)
        posts.add(GeneratedPost.builder()
                .platform("TELEGRAM")
                .text("🍂 Уют осени в каждом глотке! В " + brandName + " мы запустили согревающий сезонный латте Тыква-Пряности с натуральным тыквенным пюре, корицей и мускатным орехом. Приходите согреваться и заряжаться вдохновением! ☕✨\n\nЦена: 320₽. Ждем вас с 08:00 до 22:00!")
                .dayOffset(0)
                .build());

        // Post 2: Backstage / Story (VK)
        posts.add(GeneratedPost.builder()
                .platform("VK")
                .text("Как мы готовим наш идеальный сезонный латте в " + brandName + "? Секрет прост: свежеобжаренное зерно 100% арабика, фермерское молоко и наш авторский тыквенный сироп собственного приготовления без искусственных добавок. 🍁 Попробуйте сегодня всего за 320₽!")
                .dayOffset(2)
                .build());

        // Post 3: Promotional offer with incorrect price (Demo criteria trigger for verification!)
        // In brand facts, latte is 320₽, but this post says 250₽ -> will trigger NEEDS_REVIEW
        posts.add(GeneratedPost.builder()
                .platform("TELEGRAM")
                .text("⚡ Только на этой неделе в " + brandName + "! Заглядывайте к нам на обеденный перерыв: сезонный латте Тыква-Пряности со скидкой всего за 250₽! Отличный повод встретиться с друзьями в центре города. #кофе #сезонноеменю")
                .dayOffset(4)
                .build());

        // Post 4: Engagement / Weekend Call (INSTAGRAM)
        posts.add(GeneratedPost.builder()
                .platform("INSTAGRAM")
                .text("Планы на выходные: книга, плед и большой стакан тыквенно-пряного латте в " + brandName + ". А с кем вы разделите эту чашку кофе? Отмечайте друзей в комментариях! 👇☕")
                .dayOffset(6)
                .build());

        return posts;
    }
}
