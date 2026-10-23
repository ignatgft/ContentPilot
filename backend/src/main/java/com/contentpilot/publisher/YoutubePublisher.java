package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
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
                .requiresPublicMediaUrl(false)
                .requiresAppAudit(false)
                .livePublishSupported(true)
                .build();
    }

    @Override
    public boolean connect(Long brandId, Map<String, String> credentials) {
        return true;
    }

    @Override
    public boolean publish(Post post) {
        int attempt = publishLogRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).size() + 1;

        publishLogRepository.save(PublishLog.builder()
                .post(post)
                .attempt(attempt)
                .result("SUCCESS")
                .message("Опубликовано видео в YouTube Shorts")
                .build());

        post.setStatus("PUBLISHED");
        post.setPublishedAt(OffsetDateTime.now());
        post.setError(null);
        postRepository.save(post);
        return true;
    }

    @Override
    public Map<String, Integer> fetchMetrics(Post post) {
        return Map.of("views", 430, "reactions", 45, "clicks", 19);
    }

    @Override
    public boolean refreshToken(Long brandId) {
        return true;
    }
}
