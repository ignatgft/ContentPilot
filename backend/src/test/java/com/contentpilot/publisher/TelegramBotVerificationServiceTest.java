package com.contentpilot.publisher;

import com.contentpilot.publisher.TelegramBotVerificationService.BotChannelAccess;
import com.contentpilot.publisher.TelegramBotVerificationService.BotIdentity;
import com.contentpilot.publisher.TelegramBotVerificationService.TelegramApiException;
import com.contentpilot.publisher.TelegramBotVerificationService.VerificationResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class TelegramBotVerificationServiceTest {

    private static final String VALID_TOKEN = "123456789:AAEabcDEFghIJKlmNOPqrsTUVwxyz1234567";
    private static final String BOT_USERNAME = "contentpilot_bot";
    private static final long BOT_ID = 666_111L;

    @Mock
    private org.springframework.web.client.RestClient restClient;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @Spy
    @InjectMocks
    private TelegramBotVerificationService service;

    private JsonNodeStub json;

    @BeforeEach
    void setUp() {
        json = new JsonNodeStub();
    }

    /** Мелкая обёртка, чтобы не повторять try/readTree в каждом тесте. */
    private static final class JsonNodeStub {
        com.fasterxml.jackson.databind.JsonNode node(String raw) {
            try {
                return new ObjectMapper().readTree(raw);
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }
    }

    @Nested
    @DisplayName("verifyBot: проверка токена через getMe")
    class VerifyBot {

        @Test
        @DisplayName("Валидный токен возвращает @юзернейм и имя бота")
        void validTokenReturnsIdentity() throws Exception {
            doReturn(json.node(
                    "{\"id\": %d, \"username\": \"%s\", \"first_name\": \"ContentPilot\", \"is_bot\": true}"
                            .formatted(BOT_ID, BOT_USERNAME)))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getMe"), anyMap(), anyString());

            BotIdentity bot = service.verifyBot(VALID_TOKEN);

            assertThat(bot.id()).isEqualTo(BOT_ID);
            assertThat(bot.username()).isEqualTo("@contentpilot_bot");
            assertThat(bot.name()).isEqualTo("ContentPilot");
            verify(service).callTelegram(eq(VALID_TOKEN), eq("getMe"), anyMap(), anyString());
        }

        @Test
        @DisplayName("Токен не формата «123456:ABC…» отклоняется без запроса к API")
        void malformedTokenRejected() {
            assertThatThrownBy(() -> service.verifyBot("wrong-token"))
                    .isInstanceOf(TelegramApiException.class)
                    .hasMessageContaining("Формат токена неверен");

            verify(service, never()).callTelegram(anyString(), anyString(), anyMap(), anyString());
        }

        @Test
        @DisplayName("Пустой токен отклоняется")
        void emptyTokenRejected() {
            assertThatThrownBy(() -> service.verifyBot("  "))
                    .isInstanceOf(TelegramApiException.class)
                    .hasMessageContaining("Токен бота не задан");
        }
    }

    @Nested
    @DisplayName("checkChannelAccess: права бота в канале")
    class CheckAccess {

        @BeforeEach
        void stubGetMe() throws Exception {
            doReturn(json.node(
                    "{\"id\": %d, \"username\": \"%s\", \"first_name\": \"ContentPilot\"}"
                            .formatted(BOT_ID, BOT_USERNAME)))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getMe"), anyMap(), anyString());
        }

        @Test
        @DisplayName("Бот администратор канала с правом публикации — canPostMessages=true")
        void adminWithPostRight() throws Exception {
            stubChat();
            doReturn(json.node("""
                            [{"user": {"id": %d, "is_bot": true, "username": "%s"},
                              "status": "administrator", "can_post_messages": true}]
                            """.formatted(BOT_ID, BOT_USERNAME)))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getChatAdministrators"), anyMap(), anyString());

            BotIdentity bot = service.verifyBot(VALID_TOKEN);
            BotChannelAccess access = service.checkChannelAccess(VALID_TOKEN, bot, "@coffee_point");

            assertThat(access.chatTitle()).isEqualTo("Coffee Point");
            assertThat(access.chatType()).isEqualTo("channel");
            assertThat(access.isAdmin()).isTrue();
            assertThat(access.canPostMessages()).isTrue();
        }

        @Test
        @DisplayName("Бот администратор, но право публикации выключено — canPostMessages=false")
        void adminWithoutPostRight() throws Exception {
            stubChat();
            doReturn(json.node("""
                            [{"user": {"id": %d}, "status": "administrator", "can_post_messages": false}]
                            """.formatted(BOT_ID)))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getChatAdministrators"), anyMap(), anyString());

            BotIdentity bot = service.verifyBot(VALID_TOKEN);
            BotChannelAccess access = service.checkChannelAccess(VALID_TOKEN, bot, "@coffee_point");

            assertThat(access.isAdmin()).isTrue();
            assertThat(access.canPostMessages()).isFalse();
        }

        @Test
        @DisplayName("Бот есть в канале, но без прав администратора — fallback на getChatMember")
        void plainMemberFallsBackToChatMember() throws Exception {
            stubChat();
            doReturn(json.node("[]"))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getChatAdministrators"), anyMap(), anyString());
            doReturn(json.node("{\"user\": {\"id\": %d}, \"status\": \"member\"}".formatted(BOT_ID)))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getChatMember"), anyMap(), anyString());

            BotIdentity bot = service.verifyBot(VALID_TOKEN);
            BotChannelAccess access = service.checkChannelAccess(VALID_TOKEN, bot, "@coffee_point");

            assertThat(access.isAdmin()).isFalse();
            assertThat(access.botStatus()).isEqualTo("member");
            assertThat(access.canPostMessages()).isFalse();
        }
    }

    @Nested
    @DisplayName("verifyConnection: полный флоу подключения")
    class VerifyConnection {

        @Test
        @DisplayName("Токена нет вообще — понятная ошибка без сетевого вызова")
        void missingTokenFails() {
            VerificationResult result = service.verifyConnection(null, "@coffee_point");

            assertThat(result.ok()).isFalse();
            assertThat(result.errorMessage()).contains("@BotFather");
            verify(service, never()).callTelegram(anyString(), anyString(), anyMap(), anyString());
        }

        @Test
        @DisplayName("Бот администратор с правом публикации — подключение валидно")
        void fullValidSetup() throws Exception {
            stubGetMe();
            stubChat();
            doReturn(json.node("""
                            [{"user": {"id": %d}, "status": "administrator", "can_post_messages": true}]
                            """.formatted(BOT_ID)))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getChatAdministrators"), anyMap(), anyString());

            VerificationResult result = service.verifyConnection(VALID_TOKEN, "@coffee_point");

            assertThat(result.ok()).isTrue();
            assertThat(result.errorMessage()).isNull();
            assertThat(result.bot().username()).isEqualTo("@contentpilot_bot");
            assertThat(result.access().chatTitle()).isEqualTo("Coffee Point");
        }

        @Test
        @DisplayName("Бот не добавлен в канал — подсказка добавить администратором")
        void botNotInChannel() throws Exception {
            stubGetMe();
            stubChat();
            doThrow(new TelegramApiException("канал «@coffee_point» не найден, либо бот ещё не добавлен в него администратором."))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getChatAdministrators"), anyMap(), anyString());
            doThrow(new TelegramApiException("канал «@coffee_point» не найден, либо бот ещё не добавлен в него администратором."))
                    .when(service)
                    .callTelegram(eq(VALID_TOKEN), eq("getChatMember"), anyMap(), anyString());

            VerificationResult result = service.verifyConnection(VALID_TOKEN, "@coffee_point");

            assertThat(result.ok()).isFalse();
            assertThat(result.errorMessage()).contains("не найден в канале");
        }

        @Test
        @DisplayName("Недействительный токен — Telegram отвечает Unauthorized")
        void unauthorizedToken() throws Exception {
            String deadToken = "111111111:AAEabcDEFghIJKlmNOPqrsTUVwxyz1234567";
            // getMe в setUp не позволяет переопределить стандартную заглушку — вызывается реальный слой сети.
            // Поэтому вместо этого проверим маппинг ошибки при вызове verifyConnection.
            doThrow(new TelegramApiException("Токен бота 111111111:*** недействителен или отозван. Проверьте его в @BotFather."))
                    .when(service)
                    .callTelegram(eq(deadToken), eq("getMe"), anyMap(), anyString());

            VerificationResult result = service.verifyConnection(deadToken, "@coffee_point");

            assertThat(result.ok()).isFalse();
            assertThat(result.errorMessage()).contains("недействителен");
        }
    }

    @Nested
    @DisplayName("effectiveToken: выбор токена для проверки")
    class EffectiveToken {

        @Test
        @DisplayName("Переопределяется токеном из запроса")
        void requestTokenWins() {
            assertThat(service.effectiveToken(" 999999999:AAEdefghIJKlmNOPqrsTUVwxyz1234567 "))
                    .isEqualTo("999999999:AAEdefghIJKlmNOPqrsTUVwxyz1234567");
        }

        @Test
        @DisplayName("Без токена в запросе берётся бэкенд-токен, если он настроен")
        void fallbackToDefault() {
            ReflectionTestUtils.setField(service, "defaultBotToken", VALID_TOKEN);
            assertThat(service.effectiveToken(null)).isEqualTo(VALID_TOKEN);
            assertThat(service.effectiveToken("   ")).isEqualTo(VALID_TOKEN);
        }

        @Test
        @DisplayName("Ни токена, ни дефолта — null")
        void none() {
            ReflectionTestUtils.setField(service, "defaultBotToken", "");
            assertThat(service.effectiveToken("")).isNull();
        }
    }

    @Test
    @DisplayName("Маска токена не раскрывает секретную часть")
    void tokenMasking() {
        assertThat(service.mask(VALID_TOKEN)).isEqualTo("123456789:***");
    }

    private void stubGetMe() throws Exception {
        doReturn(json.node(
                "{\"id\": %d, \"username\": \"%s\", \"first_name\": \"ContentPilot\"}"
                        .formatted(BOT_ID, BOT_USERNAME)))
                .when(service)
                .callTelegram(eq(VALID_TOKEN), eq("getMe"), anyMap(), anyString());
    }

    private void stubChat() throws Exception {
        doReturn(json.node(
                "{\"id\": -100999, \"title\": \"Coffee Point\", \"type\": \"channel\"}"))
                .when(service)
                .callTelegram(eq(VALID_TOKEN), eq("getChat"), anyMap(), anyString());
    }
}
