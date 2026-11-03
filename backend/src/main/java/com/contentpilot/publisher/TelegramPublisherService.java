package com.contentpilot.publisher;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

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
    private final ObjectMapper objectMapper;

    @Value("${app.telegram.bot-token:}")
    private String defaultBotToken;

    @Value("${app.public-base-url:}")
    private String publicBaseUrl;

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

        if (botToken != null && !botToken.isBlank() && chatId != null && !chatId.isBlank()) {
            try {
                boolean withMedia = trySendMediaOrText(post, botToken, chatId);

                log.info("Telegram publish success for post {}", post.getId());

                publishLogRepository.save(PublishLog.builder()
                        .post(post)
                        .attempt(currentAttempt)
                        .result("SUCCESS")
                        .message(withMedia
                                ? String.format("Успешно опубликовано в Telegram канал %s (с медиа)", chatId)
                                : String.format("Успешно опубликовано в Telegram канал %s (текстом)", chatId))
                        .build());

                post.setStatus("PUBLISHED");
                post.setPublishedAt(OffsetDateTime.now());
                post.setError(null);
                postRepository.save(post);
                return true;

            } catch (Exception e) {
                log.error("Telegram publish error for post {}: {}", post.getId(), e.getMessage());

                String errorMsg = e.getMessage() != null && !e.getMessage().isBlank()
                        ? e.getMessage()
                        : "Сбой отправки публикации через Telegram API";

                publishLogRepository.save(PublishLog.builder()
                        .post(post)
                        .attempt(currentAttempt)
                        .result("FAILED")
                        .message(errorMsg)
                        .build());

                post.setStatus("FAILED");
                post.setError(errorMsg);
                postRepository.save(post);
                return false;
            }
        } else {
            String errorMsg = "Telegram бот или канал не настроен. Укажите токен бота и подключите канал в разделе «Каналы».";
            log.warn("Cannot publish post {}: {}", post.getId(), errorMsg);

            publishLogRepository.save(PublishLog.builder()
                    .post(post)
                    .attempt(currentAttempt)
                    .result("FAILED")
                    .message(errorMsg)
                    .build());

            post.setStatus("FAILED");
            post.setError(errorMsg);
            postRepository.save(post);
            return false;
        }
    }

    private boolean trySendMediaOrText(Post post, String botToken, String chatId) throws Exception {
        String mediaUrl = resolveMediaUrl(post.getMediaUrl());
        String preparedText = escapeHtml(post.getText());

        if (mediaUrl == null) {
            String textToSend = preparedText;
            if (textToSend.length() > 4096) {
                textToSend = textToSend.substring(0, 4092) + "...";
            }
            sendToTelegram(botToken, "sendMessage", Map.of(
                    "chat_id", chatId,
                    "text", textToSend,
                    "parse_mode", "HTML"
            ));
            return false;
        }

        String lowerMedia = mediaUrl.toLowerCase();
        String method = "sendMessage";

        // Caption in Telegram sendPhoto/sendVideo is limited to 1024 characters
        String caption = preparedText;
        if (caption.length() > 1024) {
            caption = caption.substring(0, 1020) + "...";
        }

        Map<String, Object> payload = Map.of(
                "chat_id", chatId,
                "text", preparedText,
                "parse_mode", "HTML"
        );

        if (lowerMedia.endsWith(".png") || lowerMedia.endsWith(".jpg") || lowerMedia.endsWith(".jpeg") || lowerMedia.endsWith(".webp")) {
            method = "sendPhoto";
            payload = Map.of(
                    "chat_id", chatId,
                    "photo", mediaUrl,
                    "caption", caption,
                    "parse_mode", "HTML"
            );
        } else if (lowerMedia.endsWith(".mp4") || lowerMedia.endsWith(".mov")) {
            method = "sendVideo";
            payload = Map.of(
                    "chat_id", chatId,
                    "video", mediaUrl,
                    "caption", caption,
                    "parse_mode", "HTML"
            );
        }

        try {
            sendToTelegram(botToken, method, payload);
            return true;
        } catch (Exception mediaError) {
            if ("sendMessage".equals(method)) {
                throw mediaError;
            }
            // If media upload failed (e.g. invalid URL or firewall), fallback to text message
            log.warn("Media send failed for post {} ({}), falling back to text: {}",
                    post.getId(), method, mediaError.getMessage());

            String textFallback = preparedText;
            if (textFallback.length() > 4096) {
                textFallback = textFallback.substring(0, 4092) + "...";
            }
            sendToTelegram(botToken, "sendMessage", Map.of(
                    "chat_id", chatId,
                    "text", textFallback,
                    "parse_mode", "HTML"
            ));
            return false;
        }
    }

    private void sendToTelegram(String botToken, String method, Map<String, Object> payload) throws Exception {
        String telegramUrl = "https://api.telegram.org/bot" + botToken + "/" + method;
        try {
            String response = restClient.post()
                    .uri(telegramUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            if (response == null || !response.contains("\"ok\":true")) {
                throw new IllegalStateException("Telegram API вернул ответ без ok=true: " + response);
            }
        } catch (RestClientResponseException e) {
            String errorDesc = extractErrorDescription(e.getResponseBodyAsString());
            String mapped = mapTelegramError(e.getStatusCode().value(), errorDesc, botToken, String.valueOf(payload.get("chat_id")));
            throw new IllegalStateException(mapped, e);
        } catch (Exception e) {
            if (e instanceof IllegalStateException) {
                throw e;
            }
            throw new IllegalStateException("Сбой сетевого подключения к Telegram API: " + e.getMessage(), e);
        }
    }

    private String extractErrorDescription(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return "";
        try {
            JsonNode node = objectMapper.readTree(responseBody);
            return node.path("description").asText("");
        } catch (Exception ignored) {
            return responseBody;
        }
    }

    private String mapTelegramError(int statusCode, String description, String botToken, String chatId) {
        String lower = description != null ? description.toLowerCase() : "";
        if (statusCode == 401 || lower.contains("unauthorized")) {
            return "Недействительный токен Telegram-бота (401 Unauthorized). Проверьте токен в @BotFather и обновите его в разделе «Каналы».";
        }
        if (lower.contains("chat not found") || lower.contains("member not found") || lower.contains("bot is not a member")) {
            return "Канал «" + (chatId != null ? chatId : "") + "» не найден, либо бот ещё не добавлен в него администратором.";
        }
        if (lower.contains("not enough rights") || lower.contains("need administrator") || lower.contains("have no rights")) {
            return "У бота нет прав на публикацию в канале «" + (chatId != null ? chatId : "") + "». Назначьте бота администратором с правом публикации сообщений.";
        }
        if (lower.contains("message is too long") || lower.contains("caption is too long")) {
            return "Текст публикации превышает допустимый лимит Telegram (максимум 4096 символов для текста, 1024 для подписи к фото/видео).";
        }
        if (lower.contains("can't parse entities")) {
            return "Ошибка форматирования текста в Telegram: некорректные спецсимволы в тексте поста.";
        }
        if (statusCode == 429 || lower.contains("too many requests") || lower.contains("retry after")) {
            return "Превышен лимит запросов Telegram API (Rate Limit). Повторите попытку через минуту.";
        }
        if (lower.contains("chat_id is empty") || lower.contains("invalid chat_id")) {
            return "Неверный ID канала. Укажите @юзернейм публичного канала (например, @mokka_coffee) или числовой ID канала.";
        }
        return "Ошибка Telegram API" + (statusCode > 0 ? " (HTTP " + statusCode + "): " : ": ") + (description == null || description.isBlank() ? "сервер отклонил запрос" : description);
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;");
    }

    /**
     * Telegram requires a publicly reachable URL for media. Media stored by Creative Studio uses
     * relative paths (/uploads/creative/...), which only make sense inside our own web app. We
     * convert them to absolute URLs via the configured public base URL; if it is not set, we fall
     * back to a text-only publication instead of failing the attempt.
     */
    private String resolveMediaUrl(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isBlank()) {
            return null;
        }
        if (mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://")) {
            return mediaUrl;
        }
        if (publicBaseUrl == null || publicBaseUrl.isBlank()) {
            log.warn("Local media {} cannot be sent (app.public-base-url is not configured); publishing text only.",
                    mediaUrl);
            return null;
        }
        String base = publicBaseUrl.trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base + (mediaUrl.startsWith("/") ? mediaUrl : "/" + mediaUrl);
    }
}
