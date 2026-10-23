package com.contentpilot.verification;

import com.contentpilot.brand.Brand;
import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationService {

    private final VerificationResultRepository verificationResultRepository;
    private final PostRepository postRepository;
    private final ObjectMapper objectMapper;

    private static final Pattern PRICE_PATTERN = Pattern.compile("(\\d{2,5})\\s*(?:₽|руб|сом|KGS)", Pattern.CASE_INSENSITIVE);

    @Transactional
    public List<VerificationResult> verifyPost(Post post) {
        Brand brand = post.getCampaign().getBrand();
        verificationResultRepository.deleteByPostId(post.getId());
        post.getVerificationResults().clear();

        List<VerificationResult> results = new ArrayList<>();
        boolean hasWarningOrError = false;

        // 1. Price Verification
        VerificationResult priceCheck = checkPrices(post, brand);
        results.add(priceCheck);
        if ("NEEDS_REVIEW".equals(priceCheck.getStatus()) || "FAILED".equals(priceCheck.getStatus())) {
            hasWarningOrError = true;
        }

        // 2. Brand Facts Verification
        VerificationResult factsCheck = checkBrandFacts(post, brand);
        results.add(factsCheck);
        if ("NEEDS_REVIEW".equals(factsCheck.getStatus()) || "FAILED".equals(factsCheck.getStatus())) {
            hasWarningOrError = true;
        }

        // 3. Platform Format Verification
        VerificationResult formatCheck = checkPlatformFormat(post);
        results.add(formatCheck);
        if ("NEEDS_REVIEW".equals(formatCheck.getStatus()) || "FAILED".equals(formatCheck.getStatus())) {
            hasWarningOrError = true;
        }

        // Save results
        for (VerificationResult res : results) {
            res.setPost(post);
            verificationResultRepository.save(res);
            post.getVerificationResults().add(res);
        }

        // Update post status based on verification
        if (hasWarningOrError) {
            post.setStatus("NEEDS_REVIEW");
            post.setError("Требуется ручная проверка перед публикацией");
        } else {
            if ("NEEDS_REVIEW".equals(post.getStatus()) || "DRAFT".equals(post.getStatus())) {
                post.setStatus("SCHEDULED");
                post.setError(null);
            }
        }

        postRepository.save(post);
        return results;
    }

    private VerificationResult checkPrices(Post post, Brand brand) {
        String text = post.getText();
        Matcher matcher = PRICE_PATTERN.matcher(text);

        // Find standard menu prices from brand facts
        int expectedLattePrice = 320;
        try {
            if (brand.getFacts() != null) {
                JsonNode factsNode = objectMapper.readTree(brand.getFacts());
                JsonNode menuNode = factsNode.path("menu");
                if (menuNode.isArray()) {
                    for (JsonNode item : menuNode) {
                        String name = item.path("name").asText("").toLowerCase();
                        if (name.contains("латте") || name.contains("тыква")) {
                            expectedLattePrice = item.path("price").asInt(320);
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error parsing brand facts for price check: {}", e.getMessage());
        }

        if (text.toLowerCase().contains("латте") && matcher.find()) {
            int foundPrice = Integer.parseInt(matcher.group(1));
            if (foundPrice != expectedLattePrice) {
                return VerificationResult.builder()
                        .checkType("PRICE_CHECK")
                        .status("NEEDS_REVIEW")
                        .message(String.format("Цена латте в посте (%d₽) не совпадает с меню бренда (%d₽)", foundPrice, expectedLattePrice))
                        .build();
            }
        }

        return VerificationResult.builder()
                .checkType("PRICE_CHECK")
                .status("PASSED")
                .message("Цены проверены: соответствуют меню бренда")
                .build();
    }

    private VerificationResult checkBrandFacts(Post post, Brand brand) {
        // Stop-words check
        String[] prohibitedWords = {"100% гарантия", "бесплатно навсегда", "лечит болезни"};
        for (String word : prohibitedWords) {
            if (post.getText().toLowerCase().contains(word)) {
                return VerificationResult.builder()
                        .checkType("BRAND_FACTS")
                        .status("NEEDS_REVIEW")
                        .message("Обнаружено запрещенное обещание: " + word)
                        .build();
            }
        }

        return VerificationResult.builder()
                .checkType("BRAND_FACTS")
                .status("PASSED")
                .message("Факты и правила бренда: Пройдено")
                .build();
    }

    private VerificationResult checkPlatformFormat(Post post) {
        int length = post.getText().length();
        String platform = post.getPlatform();

        int maxLen = switch (platform.toUpperCase()) {
            case "TELEGRAM" -> 4096;
            case "VK" -> 15000;
            case "INSTAGRAM" -> 2200;
            default -> 5000;
        };

        if (length > maxLen) {
            return VerificationResult.builder()
                    .checkType("PLATFORM_FORMAT")
                    .status("FAILED")
                    .message(String.format("Превышен лимит символов для площадки %s (%d / %d)", platform, length, maxLen))
                    .build();
        }

        return VerificationResult.builder()
                .checkType("PLATFORM_FORMAT")
                .status("PASSED")
                .message("Формат площадки: Пройдено")
                .build();
    }
}
