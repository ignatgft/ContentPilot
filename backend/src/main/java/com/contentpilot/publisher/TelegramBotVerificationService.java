package com.contentpilot.publisher;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Verifies Telegram bot tokens and bot admin rights in a channel via the Bot API:
 * - getMe         — validates the token, resolves bot identity
 * - getChat       — validates that the chat exists and is reachable by the bot
 * - getChatAdministrators (+getChatMember fallback) — resolves bot status and
 *   "Post Messages" permission inside the chat
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramBotVerificationService {

    private static final Pattern BOT_TOKEN_PATTERN = Pattern.compile("^\\d{6,}:[A-Za-z0-9_-]{20,}$");

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.telegram.bot-token:}")
    private String defaultBotToken;

    /** Bot identity resolved from getMe. Username is normalized to `@username`. */
    public record BotIdentity(long id, String username, String name) {}

    /** Bot position and permissions within the target chat. */
    public record BotChannelAccess(
            String chatTitle,
            String chatType,
            String botStatus, // administrator, creator, member, left, kicked, unknown
            boolean isAdmin,
            boolean canPostMessages) {}

    /** Combined result of the whole verification flow. */
    public record VerificationResult(
            boolean ok,
            BotIdentity bot,
            BotChannelAccess access,
            String errorMessage) {}

    /** Telegram API answered with an error or responded in an unexpected format. */
    public static class TelegramApiException extends RuntimeException {
        public TelegramApiException(String message) {
            super(message);
        }
    }

    public boolean hasDefaultBotToken() {
        return defaultBotToken != null && !defaultBotToken.isBlank();
    }

    /** Resolves the token a verification should run with: the provided one or the backend default. */
    public String effectiveToken(String requestToken) {
        if (requestToken != null && !requestToken.isBlank()) {
            return requestToken.trim();
        }
        return defaultBotToken != null && !defaultBotToken.isBlank() ? defaultBotToken.trim() : null;
    }

    /** Validates the token itself and returns the bot identity. */
    public BotIdentity verifyBot(String botToken) {
        String token = normalizeToken(botToken, "для проверки бота");
        log.debug("Verifying Telegram bot token {}", mask(token));
        JsonNode result = callTelegram(token, "getMe", Map.of(), "токен бота");

        long botId = result.path("id").asLong(0);
        String rawUsername = result.path("username").asText(null);
        String name = result.path("first_name").asText("Бот");

        if (botId == 0 || rawUsername == null || rawUsername.isBlank()) {
            throw new TelegramApiException("Telegram вернул неполные данные бота в getMe");
        }
        return new BotIdentity(botId, "@" + rawUsername, name);
    }

    /**
     * Checks the bot membership/admin status in the chat and its "Post Messages" right.
     * Mirrors the resolution logic of {@link TelegramPublisherService}: the bot must be
     * an administrator of the chat with the message-posting permission.
     */
    public BotChannelAccess checkChannelAccess(String botToken, BotIdentity bot, String chatExternalId) {
        String chatId = normalizeChatId(chatExternalId, "для проверки прав бота");
        String token = normalizeToken(botToken, "для проверки прав бота");

        JsonNode chat = callTelegram(token, "getChat", Map.of("chat_id", chatId), "канал «" + chatId + "»");
        String chatType = chat.path("type").asText("unknown");
        String chatTitle = resolveChatTitle(chat, chatId);

        BotMember botMember = findBotMember(token, chatId, bot);
        boolean canPost = botMember.canPost
                // Creator can always post.
                || botMember.status.equals("creator")
                // Basic/supergroups: rights come as can_send_messages, an admin there can post unless muted.
                || botMember.isAdmin && !chatType.equals("channel") && botMember.canSendMessages;
        return new BotChannelAccess(chatTitle, chatType, botMember.status, botMember.isAdmin, canPost);
    }

    private VerificationResult failure(String message) {
        return new VerificationResult(false, null, null, message);
    }

    /** Full flow used by the connect endpoint: token + chat + admin rights, always returns a result. */
    public VerificationResult verifyConnection(String botToken, String chatExternalId) {        if (botToken == null || botToken.isBlank()) {
            return failure("Токен бота не задан. Получите токен у @BotFather и вставьте его в поле «API токен».");
        }
        if (chatExternalId == null || chatExternalId.isBlank()) {
            return failure("Укажите ID канала — @юзернейм публичного канала или Chat ID.");
        }
        try {
            BotIdentity bot = verifyBot(botToken);
            BotChannelAccess access = checkChannelAccess(botToken, bot, chatExternalId);

            if (!access.isAdmin()) {
                if ("unknown".equals(access.botStatus()) || "left".equals(access.botStatus())
                        || "kicked".equals(access.botStatus())) {
                    return failure(String.format(
                            "Бот %s не найден в канале «%s». Добавьте его администратором канала (Добавить администратора) и проверьте права снова.",
                            bot.username(), access.chatTitle()));
                }
                return failure(String.format(
                        "Бот %s есть в «%s», но не администратор. Добавьте его в администраторы канала с правом «Публикация сообщений».",
                        bot.username(), access.chatTitle()));
            }
            if (!access.canPostMessages()) {
                return failure(String.format(
                        "Бот %s — администратор «%s», но без права «Публикация сообщений». Включите это право в настройках канала.",
                        bot.username(), access.chatTitle()));
            }
            return new VerificationResult(true, bot, access, null);
        } catch (TelegramApiException e) {
            return failure(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error while verifying Telegram bot setup: {}", e.getMessage());
            return failure("Не удалось проверить подключение к Telegram API: " + e.getMessage());
        }
    }

    private record BotMember(String status, boolean isAdmin, boolean canPost, boolean canSendMessages) {
        static BotMember absent() {
            return new BotMember("unknown", false, false, false);
        }
    }

    private BotMember findBotMember(String token, String chatId, BotIdentity bot) {
        try {
            JsonNode admins = callTelegram(token, "getChatAdministrators", Map.of("chat_id", chatId), "канал «" + chatId + "»");
            for (JsonNode member : admins) {
                if (member.path("user").path("id").asLong() != bot.id()) {
                    continue;
                }
                String status = member.path("status").asText("administrator");
                boolean canPost = member.path("can_post_messages").asBoolean(false);
                boolean canSend = member.path("can_send_messages").asBoolean(false);
                return new BotMember(status, true, canPost, canSend);
            }
        } catch (TelegramApiException e) {
            log.debug("getChatAdministrators failed for chat {}: {}", chatId, e.getMessage());
        }

        // Bot is not in the admin list — determine its raw membership via getChatMember
        try {
            JsonNode member = callTelegram(token, "getChatMember",
                    Map.of("chat_id", chatId, "user_id", String.valueOf(bot.id())),
                    "канал «" + chatId + "»");
            String status = member.path("status").asText("left");
            boolean adminStatus = status.equals("administrator") || status.equals("creator");
            return new BotMember(status, adminStatus,
                    member.path("can_post_messages").asBoolean(false),
                    member.path("can_send_messages").asBoolean(false));
        } catch (TelegramApiException e) {
            log.debug("getChatMember failed for chat {}: {}", chatId, e.getMessage());
            return BotMember.absent();
        }
    }

    JsonNode callTelegram(String botToken, String method, Map<String, String> query, String subject) {
        String url = "https://api.telegram.org/bot" + botToken + "/" + method;
        if (!query.isEmpty()) {
            StringBuilder params = new StringBuilder("?");
            for (Map.Entry<String, String> entry : query.entrySet()) {
                if (params.length() > 1) {
                    params.append('&');
                }
                params.append(entry.getKey()).append('=')
                        .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            }
            url += params;
        }

        String response;
        try {
            response = restClient.get().uri(url).retrieve().body(String.class);
        } catch (RestClientResponseException e) {
            response = e.getResponseBodyAsString();
            if (response == null || response.isBlank()) {
                throw new TelegramApiException(
                        "Telegram API недоступен (HTTP " + e.getStatusCode() + "). Попробуйте позже.");
            }
        } catch (Exception e) {
            log.error("Telegram API {} network failure: {}", method, e.getMessage());
            throw new TelegramApiException("Telegram API недоступен: " + e.getMessage());
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(response);
        } catch (Exception e) {
            throw new TelegramApiException("Telegram API вернул некорректный ответ");
        }

        if (!root.path("ok").asBoolean(false)) {
            String description = root.path("description").asText("нет описания");
            throw new TelegramApiException(mapApiError(method, description, botToken, subject));
        }
        return root.path("result");
    }

    private String mapApiError(String method, String description, String botToken, String subject) {
        if (description.contains("Unauthorized")) {
            return "Токен бота " + mask(botToken) + " недействителен или отозван. Проверьте его в @BotFather.";
        }
        if (description.toLowerCase().contains("chat not found")
                || description.toLowerCase().contains("member not found")
                || description.toLowerCase().contains("bot is not a member")) {
            return subject.startsWith("канал")
                    ? subject + " не найден, либо бот ещё не добавлен в него администратором."
                    : subject + " не найден.";
        }
        if (description.contains("bad Request: chat_id is empty")
                || description.toLowerCase().contains("invalid chat_id")) {
            return "Неверный ID канала. Укажите @юзернейм публичного канала или числовой Chat ID.";
        }
        return "Telegram API отказал в проверке " + subject + ": " + description;
    }

    private String resolveChatTitle(JsonNode chat, String fallback) {
        if (chat.hasNonNull("title")) return chat.get("title").asText();
        if (chat.hasNonNull("username")) return "@" + chat.get("username").asText();
        return fallback;
    }

    private String normalizeToken(String botToken, String context) {
        String token = botToken == null ? "" : botToken.trim();
        if (token.isEmpty()) {
            throw new TelegramApiException("Токен бота не задан " + context);
        }
        String core = token.startsWith("bot") ? token.substring(3) : token;
        if (!BOT_TOKEN_PATTERN.matcher(core).matches()) {
            throw new TelegramApiException(
                    "Формат токена неверен. Токен выдаётся @BotFather и выглядит как «123456789:AAE…».");
        }
        return core;
    }

    private String normalizeChatId(String chatExternalId, String context) {
        String chatId = chatExternalId == null ? "" : chatExternalId.trim();
        if (chatId.isEmpty()) {
            throw new TelegramApiException("ID канала не задан " + context);
        }
        if (chatId.startsWith("@")) {
            String username = chatId.substring(1);
            if (!username.matches("[A-Za-z][A-Za-z0-9_]{2,64}")) {
                throw new TelegramApiException(
                        "Неверный @юзернейм канала. Пример корректного ID: @my_public_channel");
            }
            return chatId;
        }
        // Numeric chat ids for Telegram start with '-' (private channels use -100…)
        if (chatId.matches("-?\\d{5,}")) {
            return chatId;
        }
        throw new TelegramApiException(
                "Неверный ID канала. Укажите @юзернейм публичного канала или числовой Chat ID (для приватных он начинается с -100).");
    }

    String mask(String token) {
        int colon = token.indexOf(':');
        String prefix = colon > 0 ? token.substring(0, colon) : "****";
        return prefix + ":***";
    }
}
