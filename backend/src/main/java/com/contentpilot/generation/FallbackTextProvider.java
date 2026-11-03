package com.contentpilot.generation;

import com.contentpilot.brand.Brand;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class FallbackTextProvider implements TextGenerationProvider {

    private final ObjectMapper objectMapper;

    @Override
    public String getProviderName() {
        return "fallback";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    @Override
    public List<ClaudeGenerationService.GeneratedPost> generateCampaignPosts(Brand brand, String goal, int durationDays) {
        String brandName = (brand.getName() != null && !brand.getName().isBlank()) ? brand.getName() : "Наш Бренд";
        String schedule = "";
        String address = "";

        Map<String, Integer> menu = new LinkedHashMap<>();
        try {
            if (brand.getFacts() != null && !brand.getFacts().isBlank()) {
                JsonNode factsNode = objectMapper.readTree(brand.getFacts());
                if (factsNode.has("schedule")) {
                    schedule = factsNode.path("schedule").asText("");
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

        String primaryProduct = null;
        Integer primaryPrice = null;
        String secondaryProduct = null;
        Integer secondaryPrice = null;

        if (!menu.isEmpty()) {
            List<Map.Entry<String, Integer>> entries = new ArrayList<>(menu.entrySet());
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
            if (primaryProduct == null) {
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

        StringBuilder whereClause = new StringBuilder();
        if (address != null && !address.isBlank()) {
            whereClause.append("Ждём вас по адресу: ").append(address).append(". ");
        }
        if (schedule != null && !schedule.isBlank()) {
            whereClause.append("Встречаем вас: ").append(schedule).append(". ");
        }
        String endingInfo = whereClause.length() > 0
                ? whereClause.toString().trim()
                : "Актуальный график и адрес уточняйте в профиле бренда.";

        List<ClaudeGenerationService.GeneratedPost> posts = new ArrayList<>();

        String primaryPhrase;
        if (primaryProduct != null) {
            primaryPhrase = "%s за %d ₽".formatted(primaryProduct, primaryPrice);
        } else {
            primaryPhrase = "позиции из нашего меню";
        }
        String secondaryPhrase;
        if (secondaryProduct != null) {
            secondaryPhrase = "%s (%d ₽)".formatted(secondaryProduct, secondaryPrice);
        } else {
            secondaryPhrase = null;
        }

        // Post 1: Telegram
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("TELEGRAM")
                .text(String.format("✨ Приветствуем в %s!\n\nИщете идеальный способ поднять настроение и зарядиться энергией? Попробуйте: %s.\n\n%s Приходите в гости или оформляйте предзаказ! 💫",
                        brandName, primaryPhrase, endingInfo))
                .dayOffset(0)
                .build());

        // Post 2: VK
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("VK")
                .text(String.format("Как в %s создаётся настоящий вкус?\n\nМы отбираем только свежие натуральные ингредиенты высшего качества. Наш фаворит среди гостей — %s.\n\nЗаглядывайте попробовать сегодня! #%s #ввашемгороде #свежийвкус",
                        brandName, primaryPhrase, brandName.replaceAll("\\s+", "_").toLowerCase()))
                .dayOffset(2)
                .build());

        // Post 3: Telegram
        String post3Body = secondaryPhrase != null
                ? String.format("Сделайте перерыв на обед особенным: рекомендуем %s и %s. Отличный повод встретиться с коллегами и друзьями!",
                        primaryPhrase, secondaryPhrase)
                : String.format("Сделайте перерыв на обед особенным — команда %s подберёт угощение под ваш вкус.", brandName);
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("TELEGRAM")
                .text(String.format("🔥 Специальная подборка в %s!\n\n%s\n\n%s",
                        brandName, post3Body, endingInfo))
                .dayOffset(4)
                .build());

        // Post 4: Instagram
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("INSTAGRAM")
                .text(String.format("Идеальный день начинается с маленьких удовольствий в %s ✨ Насладитесь атмосферой и попробуйте %s. А как вы планируете провести эти дни? Делитесь в комментариях! 👇✨ #%s",
                        brandName, primaryPhrase, brandName.replaceAll("\\s+", "_").toLowerCase()))
                .dayOffset(6)
                .build());

        return posts;
    }
}
