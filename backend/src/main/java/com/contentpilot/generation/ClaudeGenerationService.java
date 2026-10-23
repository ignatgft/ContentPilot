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
        String brandName = (brand.getName() != null && !brand.getName().isBlank()) ? brand.getName() : "Наш Бренд";
        String tone = (brand.getTone() != null && !brand.getTone().isBlank()) ? brand.getTone() : "Дружелюбный и вдохновляющий";
        String schedule = "ежедневно с 08:00 до 22:00";
        String address = "";

        // Parse menu and facts dynamically from Brand Memory
        Map<String, Integer> menu = new LinkedHashMap<>();
        try {
            if (brand.getFacts() != null && !brand.getFacts().isBlank()) {
                JsonNode factsNode = objectMapper.readTree(brand.getFacts());
                if (factsNode.has("schedule")) {
                    schedule = factsNode.path("schedule").asText(schedule);
                }
                if (factsNode.has("address")) {
                    address = factsNode.path("address").asText("");
                }

                JsonNode menuNode = factsNode.path("menu");
                if (menuNode.isArray()) {
                    for (JsonNode item : menuNode) {
                        String name = item.path("name").asText("");
                        int price = item.path("price").asInt(0);
                        if (!name.isBlank() && price > 0) {
                            menu.put(name, price);
                        }
                    }
                } else if (menuNode.isObject()) {
                    menuNode.fields().forEachRemaining(entry -> {
                        menu.put(entry.getKey(), entry.getValue().asInt(0));
                    });
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse brand facts in fallback generation: {}", e.getMessage());
        }

        // Determine primary and secondary product
        String primaryProduct = "Фирменное предложение";
        int primaryPrice = 300;
        String secondaryProduct = "Популярная позиция";
        int secondaryPrice = 250;

        if (!menu.isEmpty()) {
            List<Map.Entry<String, Integer>> entries = new ArrayList<>(menu.entrySet());
            // Check if goal mentions any menu item
            if (goal != null) {
                String goalLower = goal.toLowerCase();
                for (Map.Entry<String, Integer> entry : entries) {
                    if (goalLower.contains(entry.getKey().toLowerCase())) {
                        primaryProduct = entry.getKey();
                        primaryPrice = entry.getValue();
                        break;
                    }
                }
            }
            if (primaryProduct.equals("Фирменное предложение")) {
                primaryProduct = entries.get(0).getKey();
                primaryPrice = entries.get(0).getValue();
            }
            if (entries.size() > 1) {
                secondaryProduct = entries.get(1).getKey();
                secondaryPrice = entries.get(1).getValue();
            } else {
                secondaryProduct = primaryProduct;
                secondaryPrice = primaryPrice;
            }
        }

        String locationInfo = address.isBlank() ? "Ждём вас в гости!" : "Ждём вас по адресу: " + address + "!";
        List<GeneratedPost> posts = new ArrayList<>();

        // Post 1: Telegram — Главный анонс и УТП
        posts.add(GeneratedPost.builder()
                .platform("TELEGRAM")
                .text(String.format("✨ Приветствуем в %s!\n\nИщете идеальный способ поднять настроение и зарядиться энергией? Попробуйте наше фирменное блюдо — %s по цене всего %d ₽!\n\n%s График работы: %s. Приходите в гости или оформляйте предзаказ! ☕💫",
                        brandName, primaryProduct, primaryPrice, locationInfo, schedule))
                .dayOffset(0)
                .build());

        // Post 2: VK — Экспертный бэкстейдж и качество ингредиентов
        posts.add(GeneratedPost.builder()
                .platform("VK")
                .text(String.format("Как в %s создается настоящий вкус?\n\nМы отбираем только свежие натуральные ингредиенты высшего качества. Наш фаворит среди гостей — %s всего за %d ₽. Идеально сбалансированный вкус и премиальная подача.\n\nЗаглядывайте попробовать сегодня! #%s #гастрономия #свежийвкус",
                        brandName, primaryProduct, primaryPrice, brandName.replaceAll("\\s+", "_").toLowerCase()))
                .dayOffset(2)
                .build());

        // Post 3: Telegram — Специальное предложение / Комбо дня
        posts.add(GeneratedPost.builder()
                .platform("TELEGRAM")
                .text(String.format("🔥 Специальное предложение в %s!\n\nСделайте перерыв на обед особенным: попробуйте %s (%d ₽) или побалуйте себя %s (%d ₽). Отличный повод встретиться с коллегами и друзьями!\n\n%s",
                        brandName, primaryProduct, primaryPrice, secondaryProduct, secondaryPrice, locationInfo))
                .dayOffset(4)
                .build());

        // Post 4: Instagram — Вовлечение и планы на выходные
        posts.add(GeneratedPost.builder()
                .platform("INSTAGRAM")
                .text(String.format("Идеальный день начинается с маленьких удовольствий в %s ✨ Насладитесь уютной атмосферой и попробуйте %s (%d ₽). А как вы планируете провести эти дни? Делитесь в комментариях! 👇✨ #%s #weekend #lifestyle",
                        brandName, primaryProduct, primaryPrice, brandName.replaceAll("\\s+", "_").toLowerCase()))
                .dayOffset(6)
                .build());

        return posts;
    }
}
