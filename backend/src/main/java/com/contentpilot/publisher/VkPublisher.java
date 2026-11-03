package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class VkPublisher implements Publisher {

    private final ChannelRepository channelRepository;
    private final PublishLogRepository publishLogRepository;
    private final PostRepository postRepository;
    private final RestClient restClient;

    @Override
    public String getPlatform() {
        return "VK";
    }

    @Override
    public PublisherCapabilities capabilities() {
        return PublisherCapabilities.builder()
                .platform("VK")
                .displayName("ВКонтакте Сообщество")
                .maxTextLength(15000)
                .supportedMediaTypes(List.of("TEXT", "IMAGE", "VIDEO"))
                .requiresPublicMediaUrl(false)
                .requiresAppAudit(false)
                .livePublishSupported(true)
                .build();
    }

    @Override
    public boolean connect(Long brandId, Map<String, String> credentials) {
        String groupId = credentials.get("groupId");
        String token = credentials.get("token");

        Channel channel = channelRepository.findFirstByBrandIdAndPlatform(brandId, "VK")
                .orElseGet(() -> Channel.builder().brand(null).platform("VK").build());

        channel.setExternalId(groupId != null ? groupId : null);
        channel.setEncryptedToken(token);
        channel.setStatus("CONNECTED");
        channelRepository.save(channel);
        return true;
    }

    @Override
    public boolean publish(Post post) {
        Long brandId = post.getCampaign().getBrand().getId();
        Optional<Channel> channelOpt = channelRepository.findFirstByBrandIdAndPlatform(brandId, "VK");

        int attempt = publishLogRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).size() + 1;

        String groupId = channelOpt.map(Channel::getExternalId).orElse(null);
        String accessToken = channelOpt.map(Channel::getEncryptedToken).orElse(null);

        if (accessToken == null || accessToken.isBlank()) {
            // No community token configured — do not fake success, hand over to manual publishing.
            publishLogRepository.save(PublishLog.builder()
                    .post(post)
                    .attempt(attempt)
                    .result("READY_MANUAL")
                    .message("VK API-токен сообщества не указан: текст и медиа подготовлены для ручной публикации"
                            + (groupId != null ? " (ID: " + groupId + ")" : "") + ".")
                    .build());

            post.setStatus("READY_MANUAL");
            postRepository.save(post);
            return true;
        }

        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("owner_id", resolveOwnerId(groupId));
            form.add("message", post.getText());
            form.add("access_token", accessToken);
            form.add("v", "5.199");

            String response = restClient.post()
                    .uri("https://api.vk.com/method/wall.post")
                    .body(form)
                    .retrieve()
                    .body(String.class);

            log.info("VK publish success for post {}: {}", post.getId(), response);

            publishLogRepository.save(PublishLog.builder()
                    .post(post)
                    .attempt(attempt)
                    .result("SUCCESS")
                    .message("Опубликовано на стене сообщества VK (ID: " + groupId + ")")
                    .build());

            post.setStatus("PUBLISHED");
            post.setPublishedAt(OffsetDateTime.now());
            post.setError(null);
            postRepository.save(post);
            return true;
        } catch (Exception e) {
            log.error("VK publish error for post {}: {}", post.getId(), e.getMessage());

            publishLogRepository.save(PublishLog.builder()
                    .post(post)
                    .attempt(attempt)
                    .result("FAILED")
                    .message("Ошибка VK API: " + e.getMessage())
                    .build());

            if (attempt >= 3) {
                post.setStatus("FAILED");
            }
            post.setError("Ошибка VK API: " + e.getMessage());
            postRepository.save(post);
            return false;
        }
    }

    private String resolveOwnerId(String groupId) {
        if (groupId == null || groupId.isBlank()) {
            throw new IllegalArgumentException("ID сообщества VK не указан");
        }
        String trimmed = groupId.trim();
        if (trimmed.matches("-?\\d+.*") && !trimmed.startsWith("-")) {
            return "-" + trimmed;
        }
        return trimmed;
    }

    @Override
    public Map<String, Integer> fetchMetrics(Post post) {
        return Map.of();
    }

    @Override
    public boolean refreshToken(Long brandId) {
        return true;
    }
}
