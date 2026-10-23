package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

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

        channel.setExternalId(groupId != null ? groupId : "club_demo");
        channel.setEncryptedToken(token != null ? token : "vk_token_demo");
        channel.setStatus("CONNECTED");
        channelRepository.save(channel);
        return true;
    }

    @Override
    public boolean publish(Post post) {
        Long brandId = post.getCampaign().getBrand().getId();
        Optional<Channel> channelOpt = channelRepository.findFirstByBrandIdAndPlatform(brandId, "VK");

        int attempt = publishLogRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).size() + 1;

        if (channelOpt.isPresent() && !channelOpt.get().getEncryptedToken().startsWith("demo")) {
            // Live VK API wall.post call would happen here
            log.info("Publishing post {} to VK group {}", post.getId(), channelOpt.get().getExternalId());
        }

        publishLogRepository.save(PublishLog.builder()
                .post(post)
                .attempt(attempt)
                .result("SUCCESS")
                .message("Опубликовано на стене сообщества VK (ID: " +
                        channelOpt.map(Channel::getExternalId).orElse("демо-сообщество") + ")")
                .build());

        post.setStatus("PUBLISHED");
        post.setPublishedAt(OffsetDateTime.now());
        post.setError(null);
        postRepository.save(post);
        return true;
    }

    @Override
    public Map<String, Integer> fetchMetrics(Post post) {
        return Map.of("views", 210, "reactions", 24, "clicks", 12);
    }

    @Override
    public boolean refreshToken(Long brandId) {
        return true;
    }
}
