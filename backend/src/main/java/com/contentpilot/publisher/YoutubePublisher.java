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
public class YoutubePublisher implements Publisher {

    private final PublishLogRepository publishLogRepository;
    private final PostRepository postRepository;

    @Override
    public String getPlatform() {
        return "YOUTUBE";
    }

    @Override
    public PublisherCapabilities capabilities() {
        return PublisherCapabilities.builder()
                .platform("YOUTUBE")
                .displayName("YouTube Shorts")
                .maxTextLength(5000)
                .supportedMediaTypes(List.of("VIDEO"))
                .requiresPublicMediaUrl(true)
                .requiresAppAudit(true)
                .livePublishSupported(false)
                .auditNotice("Загрузка видео через YouTube Data API v3 требует OAuth-авторизации канала. Посты формируются в режиме «Готово к публикации».")
                .build();
    }

    @Override
    public boolean connect(Long brandId, Map<String, String> credentials) {
        return true;
    }

    @Override
    public boolean publish(Post post) {
        int attempt = publishLogRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).size() + 1;

        // YouTube Data API v3 uploads require an OAuth2 channel grant; without it we do not fake success.
        publishLogRepository.save(PublishLog.builder()
                .post(post)
                .attempt(attempt)
                .result("READY_MANUAL")
                .message("YouTube требует OAuth-авторизацию канала: текст и видео подготовлены для ручной загрузки в Shorts.")
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
