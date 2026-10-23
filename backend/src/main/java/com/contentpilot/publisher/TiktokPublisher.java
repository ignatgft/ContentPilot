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
public class TiktokPublisher implements Publisher {

    private final PublishLogRepository publishLogRepository;
    private final PostRepository postRepository;

    @Override
    public String getPlatform() {
        return "TIKTOK";
    }

    @Override
    public PublisherCapabilities capabilities() {
        return PublisherCapabilities.builder()
                .platform("TIKTOK")
                .displayName("TikTok Content Posting API")
                .maxTextLength(2200)
                .supportedMediaTypes(List.of("VIDEO"))
                .requiresPublicMediaUrl(true)
                .requiresAppAudit(true)
                .livePublishSupported(false) // Until app audit approved
                .auditNotice("Приложение ожидает завершения аудита TikTok. Посты формируются в режиме «Готово к публикации».")
                .build();
    }

    @Override
    public boolean connect(Long brandId, Map<String, String> credentials) {
        return true;
    }

    @Override
    public boolean publish(Post post) {
        int attempt = publishLogRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).size() + 1;

        // In Stage 2, TikTok without audit falls back honestly to READY_MANUAL per Section 1 & 4.4
        publishLogRepository.save(PublishLog.builder()
                .post(post)
                .attempt(attempt)
                .result("READY_MANUAL")
                .message("Аудит TikTok в процессе: пост переведён в статус «Готово к публикации» со сценарием и хэштегами.")
                .build());

        post.setStatus("READY_MANUAL");
        postRepository.save(post);
        return true;
    }

    @Override
    public Map<String, Integer> fetchMetrics(Post post) {
        return Map.of("views", 0, "reactions", 0, "clicks", 0);
    }

    @Override
    public boolean refreshToken(Long brandId) {
        return true;
    }
}
