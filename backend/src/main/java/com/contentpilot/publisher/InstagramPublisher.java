package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class InstagramPublisher implements Publisher {

    private final PublishLogRepository publishLogRepository;
    private final PostRepository postRepository;

    @Override
    public String getPlatform() {
        return "INSTAGRAM";
    }

    @Override
    public PublisherCapabilities capabilities() {
        return PublisherCapabilities.builder()
                .platform("INSTAGRAM")
                .displayName("Instagram Business (Graph API)")
                .maxTextLength(2200)
                .supportedMediaTypes(List.of("IMAGE", "VIDEO"))
                .requiresPublicMediaUrl(true)
                .requiresAppAudit(true)
                .livePublishSupported(false)
                .auditNotice("Публикация через Meta Graph API доступна после прохождения аудита приложения. Посты формируются в режиме «Готово к публикации».")
                .build();
    }

    @Override
    public boolean connect(Long brandId, Map<String, String> credentials) {
        return true;
    }

    @Override
    public boolean publish(Post post) {
        int attempt = publishLogRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).size() + 1;

        // Publishing through the graph API requires an approved Meta app + linked business account.
        // Until then we honestly hand the prepared post over for manual publishing.
        publishLogRepository.save(PublishLog.builder()
                .post(post)
                .attempt(attempt)
                .result("READY_MANUAL")
                .message("Graph API ожидает аудита Meta: текст и медиа подготовлены для ручной публикации в Instagram.")
                .build());

        post.setStatus("READY_MANUAL");
        postRepository.save(post);
        return true;
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
