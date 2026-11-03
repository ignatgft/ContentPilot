package com.contentpilot.verification;

import com.contentpilot.brand.Brand;
import com.contentpilot.campaign.Campaign;
import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VerificationServiceTest {

    @Mock
    private VerificationResultRepository verificationResultRepository;

    @Mock
    private PostRepository postRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private VerificationService verificationService;

    private Brand brand;
    private Campaign campaign;

    @BeforeEach
    void setUp() {
        brand = Brand.builder()
                .id(1L)
                .name("Coffee Point")
                .description("Кофейня в центре")
                .facts("{\"menu\": [{\"name\": \"латте\", \"price\": 320}, {\"name\": \"капучино\", \"price\": 220}, {\"name\": \"стрижка\", \"price\": 1800}]}")
                .build();

        campaign = Campaign.builder()
                .id(1L)
                .brand(brand)
                .goal("Тестовая кампания")
                .build();
    }

    @Test
    @DisplayName("Should pass verification when price matches brand facts menu")
    void testPriceMatchesFacts() {
        Post post = Post.builder()
                .id(10L)
                .campaign(campaign)
                .platform("TELEGRAM")
                .text("Свежий латте за 320 ₽ ждёт вас!")
                .status("DRAFT")
                .verificationResults(new ArrayList<>())
                .build();

        when(verificationResultRepository.save(any(VerificationResult.class))).thenAnswer(i -> i.getArgument(0));

        List<VerificationResult> results = verificationService.verifyPost(post);

        assertThat(results).isNotEmpty();
        VerificationResult priceCheck = results.stream()
                .filter(r -> "PRICE_CHECK".equals(r.getCheckType()))
                .findFirst()
                .orElse(null);

        assertThat(priceCheck).isNotNull();
        assertThat(priceCheck.getStatus()).isEqualTo("PASSED");
        assertThat(post.getStatus()).isEqualTo("SCHEDULED");
    }

    @Test
    @DisplayName("Should flag post as NEEDS_REVIEW when price does not match menu")
    void testPriceMismatchNeedsReview() {
        Post post = Post.builder()
                .id(11L)
                .campaign(campaign)
                .platform("VK")
                .text("Свежий латте всего за 250 ₽!") // 250 instead of 320 in menu!
                .status("DRAFT")
                .verificationResults(new ArrayList<>())
                .build();

        when(verificationResultRepository.save(any(VerificationResult.class))).thenAnswer(i -> i.getArgument(0));

        List<VerificationResult> results = verificationService.verifyPost(post);

        assertThat(results).isNotEmpty();
        VerificationResult priceCheck = results.stream()
                .filter(r -> "PRICE_CHECK".equals(r.getCheckType()))
                .findFirst()
                .orElse(null);

        assertThat(priceCheck).isNotNull();
        assertThat(priceCheck.getStatus()).isEqualTo("NEEDS_REVIEW");
        assertThat(post.getStatus()).isEqualTo("NEEDS_REVIEW");
    }

    @Test
    @DisplayName("Should correctly verify multiple products and prices in a single post without false alarms")
    void testMultiProductPriceProximityMatches() {
        Post post = Post.builder()
                .id(12L)
                .campaign(campaign)
                .platform("TELEGRAM")
                .text("Попробуйте наш капучино за 220 ₽ или нежный латте за 320 руб!")
                .status("DRAFT")
                .verificationResults(new ArrayList<>())
                .build();

        when(verificationResultRepository.save(any(VerificationResult.class))).thenAnswer(i -> i.getArgument(0));

        List<VerificationResult> results = verificationService.verifyPost(post);

        VerificationResult priceCheck = results.stream()
                .filter(r -> "PRICE_CHECK".equals(r.getCheckType()))
                .findFirst()
                .orElse(null);

        assertThat(priceCheck).isNotNull();
        assertThat(priceCheck.getStatus()).isEqualTo("PASSED");
        assertThat(post.getStatus()).isEqualTo("SCHEDULED");
    }

    @Test
    @DisplayName("Should handle thousands separators formatted as 1 800 ₽")
    void testThousandsSeparatorMatches() {
        Post post = Post.builder()
                .id(13L)
                .campaign(campaign)
                .platform("TELEGRAM")
                .text("Стильная мужская стрижка всего за 1 800 ₽ в наших салонах")
                .status("DRAFT")
                .verificationResults(new ArrayList<>())
                .build();

        when(verificationResultRepository.save(any(VerificationResult.class))).thenAnswer(i -> i.getArgument(0));

        List<VerificationResult> results = verificationService.verifyPost(post);

        VerificationResult priceCheck = results.stream()
                .filter(r -> "PRICE_CHECK".equals(r.getCheckType()))
                .findFirst()
                .orElse(null);

        assertThat(priceCheck).isNotNull();
        assertThat(priceCheck.getStatus()).isEqualTo("PASSED");
    }

    @Test
    @DisplayName("Should flag forbidden stop words with NEEDS_REVIEW")
    void testStopWordsFlagged() {
        Post post = Post.builder()
                .id(14L)
                .campaign(campaign)
                .platform("TELEGRAM")
                .text("Наш кофе гарантирует 100% гарантия бодрости на весь день")
                .status("DRAFT")
                .verificationResults(new ArrayList<>())
                .build();

        when(verificationResultRepository.save(any(VerificationResult.class))).thenAnswer(i -> i.getArgument(0));

        List<VerificationResult> results = verificationService.verifyPost(post);

        VerificationResult factsCheck = results.stream()
                .filter(r -> "BRAND_FACTS".equals(r.getCheckType()))
                .findFirst()
                .orElse(null);

        assertThat(factsCheck).isNotNull();
        assertThat(factsCheck.getStatus()).isEqualTo("NEEDS_REVIEW");
        assertThat(post.getStatus()).isEqualTo("NEEDS_REVIEW");
    }

    @Test
    @DisplayName("Should fail platform format check when Telegram text exceeds 4096 characters")
    void testPlatformLimitExceeded() {
        String longText = "A".repeat(4100);
        Post post = Post.builder()
                .id(15L)
                .campaign(campaign)
                .platform("TELEGRAM")
                .text(longText)
                .status("DRAFT")
                .verificationResults(new ArrayList<>())
                .build();

        when(verificationResultRepository.save(any(VerificationResult.class))).thenAnswer(i -> i.getArgument(0));

        List<VerificationResult> results = verificationService.verifyPost(post);

        VerificationResult formatCheck = results.stream()
                .filter(r -> "PLATFORM_FORMAT".equals(r.getCheckType()))
                .findFirst()
                .orElse(null);

        assertThat(formatCheck).isNotNull();
        assertThat(formatCheck.getStatus()).isEqualTo("FAILED");
        assertThat(post.getStatus()).isEqualTo("NEEDS_REVIEW");
    }
}
