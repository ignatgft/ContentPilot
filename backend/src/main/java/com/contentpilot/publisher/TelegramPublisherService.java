package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramPublisherService {

    private final RestClient restClient;
    private final ChannelRepository channelRepository;
    private final PublishLogRepository publishLogRepository;
    private final PostRepository postRepository;

    @Value("${app.telegram.bot-token:}")
    private String defaultBotToken;

    @Transactional
    public boolean publishToTelegram(Post post) {
        Long brandId = post.getCampaign().getBrand().getId();
        Optional<Channel> channelOpt = channelRepository.findFirstByBrandIdAndPlatform(brandId, "TELEGRAM");

        String botToken = defaultBotToken;
        String chatId = null;

        if (channelOpt.isPresent()) {
            Channel channel = channelOpt.get();
            chatId = channel.getExternalId();
            if (channel.getEncryptedToken() != null && !channel.getEncryptedToken().isBlank()) {
                botToken = channel.getEncryptedToken();
            }
        }

        int currentAttempt = publishLogRepository.findByPostIdOrderByCreatedAtDesc(post.getId()).size() + 1;

        if (botToken != null && !botToken.isBlank() && !botToken.startsWith("your-") && chatId != null && !chatId.isBlank()) {
            try {
                String telegramUrl = "https://api.telegram.org/bot" + botToken + "/sendMessage";
                Map<String, Object> payload = Map.of(
                        "chat_id", chatId,
                        "text", post.getText(),
                        "parse_mode", "HTML"
                );

                String response = restClient.post()
                        .uri(telegramUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(payload)
                        .retrieve()
                        .body(String.class);

                log.info("Telegram publish success for post {}: {}", post.getId(), response);

                publishLogRepository.save(PublishLog.builder()
                        .post(post)
                        .attempt(currentAttempt)
                        .result("SUCCESS")
                        .message("Успешно опубликовано в Telegram канал " + chatId)
                        .build());

                post.setStatus("PUBLISHED");
                post.setPublishedAt(OffsetDateTime.now());
                post.setError(null);
                postRepository.save(post);
                return true;

            } catch (Exception e) {
                log.error("Telegram publish error for post {}: {}", post.getId(), e.getMessage());

                publishLogRepository.save(PublishLog.builder()
                        .post(post)
                        .attempt(currentAttempt)
                        .result("FAILED")
                        .message("Ошибка Telegram API: " + e.getMessage())
                        .build());

                if (currentAttempt >= 3) {
                    post.setStatus("FAILED");
                } else {
                    post.setStatus("SCHEDULED");
                }
                post.setError(e.getMessage());
                postRepository.save(post);
                return false;
            }
        } else {
            // Emulated publish for test/demo mode when real Telegram credentials are not yet configured
            log.info("Simulating Telegram publish for post {} in demo mode", post.getId());

            publishLogRepository.save(PublishLog.builder()
                    .post(post)
                    .attempt(currentAttempt)
                    .result("SUCCESS")
                    .message("Демо-публикация успешно сымитирована (подключите TELEGRAM_BOT_TOKEN для реальной отправки)")
                    .build());

            post.setStatus("PUBLISHED");
            post.setPublishedAt(OffsetDateTime.now());
            post.setError(null);
            postRepository.save(post);
            return true;
        }
    }
}
