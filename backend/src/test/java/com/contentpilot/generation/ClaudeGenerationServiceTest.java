package com.contentpilot.generation;

import com.contentpilot.brand.Brand;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ClaudeGenerationServiceTest {

    private final ClaudeGenerationService service = new ClaudeGenerationService(
            RestClient.builder().build(),
            new ObjectMapper()
    );

    @Test
    @DisplayName("Should generate structured campaign posts using fallback marketing engine when API key is absent")
    void testFallbackGeneration() {
        Brand brand = Brand.builder()
                .name("Coffee Point")
                .description("Кофейня со свежей выпечкой")
                .audience("Студенты и офисные сотрудники")
                .tone("Дружелюбный, тёплый")
                .facts("{\"address\":\"ул. Ленина 42\", \"menu\":{\"капучино\":320}}")
                .build();

        List<ClaudeGenerationService.GeneratedPost> posts = service.generateCampaignPosts(brand, "Привлечь гостей на утренний кофе", 7);

        assertThat(posts).isNotEmpty();
        assertThat(posts.size()).isGreaterThanOrEqualTo(4);

        for (ClaudeGenerationService.GeneratedPost post : posts) {
            assertThat(post.getPlatform()).isIn("TELEGRAM", "VK", "INSTAGRAM");
            assertThat(post.getText()).isNotBlank();
            assertThat(post.getText()).contains("Coffee Point");
        }
    }
}
