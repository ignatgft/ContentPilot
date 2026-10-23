package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TelegramPublisher implements Publisher {

    private final TelegramPublisherService telegramPublisherService;

    @Override
    public String getPlatform() {
        return "TELEGRAM";
    }

    @Override
    public PublisherCapabilities capabilities() {
        return PublisherCapabilities.builder()
                .platform("TELEGRAM")
                .displayName("Telegram Канал")
                .maxTextLength(4096)
                .supportedMediaTypes(List.of("TEXT", "IMAGE", "VIDEO"))
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
        return telegramPublisherService.publishToTelegram(post);
    }

    @Override
    public Map<String, Integer> fetchMetrics(Post post) {
        return Map.of("views", 142, "reactions", 18, "clicks", 7);
    }

    @Override
    public boolean refreshToken(Long brandId) {
        return true;
    }
}
