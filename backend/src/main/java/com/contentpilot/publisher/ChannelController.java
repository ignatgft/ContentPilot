package com.contentpilot.publisher;

import com.contentpilot.auth.User;
import com.contentpilot.brand.Brand;
import com.contentpilot.brand.BrandRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
@Tag(name = "Channels", description = "Подключение Telegram, VK, YouTube, Instagram и TikTok")
public class ChannelController {

    private final ChannelRepository channelRepository;
    private final BrandRepository brandRepository;
    private final PublisherRegistry publisherRegistry;
    private final TelegramBotVerificationService telegramBotVerificationService;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectChannelRequest {
        @NotBlank(message = "ID канала / сообщества / аккаунта обязателен")
        private String externalId;
        private String botToken;
        private String platform = "TELEGRAM";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyBotTokenRequest {
        @NotBlank(message = "Токен бота обязателен")
        private String botToken;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckBotAdminRequest {
        private String botToken;
        @NotBlank(message = "ID канала обязателен")
        private String channelExternalId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BotIdentityResponse {
        private boolean valid;
        private String botUsername;
        private String botName;
        private Long botId;
        private String error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BotAdminCheckResponse {
        private boolean valid;
        private String botUsername;
        private String chatTitle;
        private String chatType;
        private String botStatus;
        private boolean isAdmin;
        private boolean canPostMessages;
        private String error;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChannelResponse {
        private Long id;
        private String platform;
        private String externalId;
        private String status;
        private String botUsername;
        private OffsetDateTime verifiedAt;
        private String verificationError;
    }

    @GetMapping("/capabilities")
    @Operation(summary = "Получить возможности и лимиты всех поддерживаемых площадок")
    public ResponseEntity<List<PublisherCapabilities>> getCapabilities() {
        return ResponseEntity.ok(publisherRegistry.getAllCapabilities());
    }

    @PostMapping("/telegram/verify-bot")
    @Operation(summary = "Проверить валидность токена Telegram-бота (getMe)")
    public ResponseEntity<BotIdentityResponse> verifyBotToken(@Valid @RequestBody VerifyBotTokenRequest request) {
        try {
            TelegramBotVerificationService.BotIdentity bot = telegramBotVerificationService.verifyBot(request.getBotToken());
            return ResponseEntity.ok(BotIdentityResponse.builder()
                    .valid(true)
                    .botUsername(bot.username())
                    .botName(bot.name())
                    .botId(bot.id())
                    .build());
        } catch (TelegramBotVerificationService.TelegramApiException e) {
            return ResponseEntity.ok(BotIdentityResponse.builder()
                    .valid(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/telegram/check-admin")
    @Operation(summary = "Проверить, что бот является администратором канала с правом публикации")
    public ResponseEntity<BotAdminCheckResponse> checkBotAdmin(@Valid @RequestBody CheckBotAdminRequest request) {
        String token = telegramBotVerificationService.effectiveToken(request.getBotToken());
        if (token == null) {
            return ResponseEntity.ok(BotAdminCheckResponse.builder()
                    .valid(false)
                    .canPostMessages(false)
                    .error("Токен бота не задан. Укажите токен выше или настройте TELEGRAM_BOT_TOKEN в бэкенде.")
                    .build());
        }
        try {
            TelegramBotVerificationService.BotIdentity bot = telegramBotVerificationService.verifyBot(token);
            TelegramBotVerificationService.BotChannelAccess access =
                    telegramBotVerificationService.checkChannelAccess(token, bot, request.getChannelExternalId());
            boolean valid = access.isAdmin() && access.canPostMessages();
            return ResponseEntity.ok(BotAdminCheckResponse.builder()
                    .valid(valid)
                    .botUsername(bot.username())
                    .chatTitle(access.chatTitle())
                    .chatType(access.chatType())
                    .botStatus(access.botStatus())
                    .isAdmin(access.isAdmin())
                    .canPostMessages(access.canPostMessages())
                    .error(valid ? null : (access.isAdmin()
                            ? "Бот — администратор, но право «Публикация сообщений» выключено."
                            : "Бот не администратор канала. Добавьте его в администраторы с правом «Публикация сообщений»."))
                    .build());
        } catch (TelegramBotVerificationService.TelegramApiException e) {
            return ResponseEntity.ok(BotAdminCheckResponse.builder()
                    .valid(false)
                    .error(e.getMessage())
                    .build());
        }
    }

    @GetMapping
    @Operation(summary = "Список подключенных каналов бренда")
    public ResponseEntity<List<ChannelResponse>> getChannels(@AuthenticationPrincipal User user) {
        Brand brand = brandRepository.findFirstByUserIdOrderByIdDesc(user.getId())
                .orElse(null);
        if (brand == null) return ResponseEntity.ok(List.of());

        List<ChannelResponse> responses = channelRepository.findByBrandId(brand.getId()).stream()
                .map(ChannelController::toChannelResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{platform}")
    @Operation(summary = "Подключить канал (telegram, vk, youtube, instagram, tiktok). Telegram-подключение требует валидного бота-администратора канала.")
    public ResponseEntity<ChannelResponse> connectChannel(
            @PathVariable String platform,
            @AuthenticationPrincipal User user,
            @RequestBody ConnectChannelRequest request) {
        Brand brand = brandRepository.findFirstByUserIdOrderByIdDesc(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сначала создайте бренд"));

        String normalizedPlatform = platform.toUpperCase();

        Channel channel = channelRepository.findFirstByBrandIdAndPlatform(brand.getId(), normalizedPlatform)
                .orElseGet(() -> Channel.builder()
                        .brand(brand)
                        .platform(normalizedPlatform)
                        .build());

        channel.setExternalId(request.getExternalId().trim());
        if (request.getBotToken() != null && !request.getBotToken().isBlank()) {
            channel.setEncryptedToken(request.getBotToken().trim());
        } else if (channel.getEncryptedToken() == null) {
            // encrypted_token is NOT NULL in the schema; empty value means "no own token",
            // publication falls back to the backend-wide app.telegram.bot-token.
            channel.setEncryptedToken("");
        }

        if ("TELEGRAM".equals(normalizedPlatform)) {
            String token = telegramBotVerificationService.effectiveToken(request.getBotToken());
            TelegramBotVerificationService.VerificationResult verification =
                    telegramBotVerificationService.verifyConnection(token, channel.getExternalId());
            if (!verification.ok()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, verification.errorMessage());
            }
            channel.setBotUsername(verification.bot().username());
            channel.setVerifiedAt(OffsetDateTime.now());
            channel.setVerificationError(null);
        } else {
            // Other platforms have no live token verification yet — reset the stale error.
            channel.setVerificationError(null);
        }

        channel.setStatus("CONNECTED");
        channel = channelRepository.save(channel);

        return ResponseEntity.ok(toChannelResponse(channel));
    }

    @DeleteMapping("/{channelId}")
    @Operation(summary = "Отключить канал. Запланированные посты сохраняются, но живые публикации остановятся.")
    public ResponseEntity<Void> disconnectChannel(
            @PathVariable Long channelId,
            @AuthenticationPrincipal User user) {
        Brand brand = brandRepository.findFirstByUserIdOrderByIdDesc(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Бренд не найден"));

        Channel channel = channelRepository.findById(channelId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Канал не найден"));
        if (!channel.getBrand().getId().equals(brand.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет прав на управление этим каналом");
        }

        channelRepository.delete(channel);
        return ResponseEntity.noContent().build();
    }

    private static ChannelResponse toChannelResponse(Channel c) {
        return ChannelResponse.builder()
                .id(c.getId())
                .platform(c.getPlatform())
                .externalId(c.getExternalId())
                .status(c.getStatus())
                .botUsername(c.getBotUsername())
                .verifiedAt(c.getVerifiedAt())
                .verificationError(c.getVerificationError())
                .build();
    }
}
