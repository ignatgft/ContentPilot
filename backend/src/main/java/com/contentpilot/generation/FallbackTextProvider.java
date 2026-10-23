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
        String schedule = "ежедневно с 08:00 до 22:00";
        String address = "";

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

        String primaryProduct = "Фирменное предложение";
        int primaryPrice = 300;
        String secondaryProduct = "Популярная позиция";
        int secondaryPrice = 250;

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
        List<ClaudeGenerationService.GeneratedPost> posts = new ArrayList<>();

        // Post 1: Telegram
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("TELEGRAM")
                .text(String.format("✨ Приветствуем в %s!\n\nИщете идеальный способ поднять настроение и зарядиться энергией? Попробуйте наше фирменное предложение — %s по цене всего %d ₽!\n\n%s График работы: %s. Приходите в гости или оформляйте предзаказ! ☕💫",
                        brandName, primaryProduct, primaryPrice, locationInfo, schedule))
                .dayOffset(0)
                .build());

        // Post 2: VK
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("VK")
                .text(String.format("Как в %s создается настоящий вкус?\n\nМы отбираем только свежие натуральные ингредиенты высшего качества. Наш фаворит среди гостей — %s всего за %d ₽. Идеально сбалансированный вкус и премиальная подача.\n\nЗаглядывайте попробовать сегодня! #%s #гастрономия #свежийвкус",
                        brandName, primaryProduct, primaryPrice, brandName.replaceAll("\\s+", "_").toLowerCase()))
                .dayOffset(2)
                .build());

        // Post 3: Telegram
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("TELEGRAM")
                .text(String.format("🔥 Специальное предложение в %s!\n\nСделайте перерыв на обед особенным: попробуйте %s (%d ₽) или побалуйте себя %s (%d ₽). Отличный повод встретиться с коллегами и друзьями!\n\n%s",
                        brandName, primaryProduct, primaryPrice, secondaryProduct, secondaryPrice, locationInfo))
                .dayOffset(4)
                .build());

        // Post 4: Instagram
        posts.add(ClaudeGenerationService.GeneratedPost.builder()
                .platform("INSTAGRAM")
                .text(String.format("Идеальный день начинается с маленьких удовольствий в %s ✨ Насладитесь уютной атмосферой и попробуйте %s (%d ₽). А как вы планируете провести эти дни? Делитесь в комментариях! 👇✨ #%s #weekend #lifestyle",
                        brandName, primaryProduct, primaryPrice, brandName.replaceAll("\\s+", "_").toLowerCase()))
                .dayOffset(6)
                .build());

        return posts;
    }
}
