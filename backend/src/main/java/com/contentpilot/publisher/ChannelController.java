package com.contentpilot.publisher;

import com.contentpilot.auth.User;
import com.contentpilot.brand.Brand;
import com.contentpilot.brand.BrandRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

import java.util.List;

@RestController
@RequestMapping("/api/v1/channels")
@RequiredArgsConstructor
@Tag(name = "Channels", description = "Подключение Telegram, VK, YouTube, Instagram и TikTok")
public class ChannelController {

    private final ChannelRepository channelRepository;
    private final BrandRepository brandRepository;
    private final PublisherRegistry publisherRegistry;

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
    @Builder
    public static class ChannelResponse {
        private Long id;
        private String platform;
        private String externalId;
        private String status;
    }

    @GetMapping("/capabilities")
    @Operation(summary = "Получить возможности и лимиты всех поддерживаемых площадок")
    public ResponseEntity<List<PublisherCapabilities>> getCapabilities() {
        return ResponseEntity.ok(publisherRegistry.getAllCapabilities());
    }

    @GetMapping
    @Operation(summary = "Список подключенных каналов бренда")
    public ResponseEntity<List<ChannelResponse>> getChannels(@AuthenticationPrincipal User user) {
        Brand brand = brandRepository.findByUserId(user.getId())
                .orElse(null);
        if (brand == null) return ResponseEntity.ok(List.of());

        List<ChannelResponse> responses = channelRepository.findByBrandId(brand.getId()).stream()
                .map(c -> ChannelResponse.builder()
                        .id(c.getId())
                        .platform(c.getPlatform())
                        .externalId(c.getExternalId())
                        .status(c.getStatus())
                        .build())
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{platform}")
    @Operation(summary = "Подключить канал (telegram, vk, youtube, instagram, tiktok)")
    public ResponseEntity<ChannelResponse> connectChannel(
            @PathVariable String platform,
            @AuthenticationPrincipal User user,
            @RequestBody ConnectChannelRequest request) {
        Brand brand = brandRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сначала создайте бренд"));

        String normalizedPlatform = platform.toUpperCase();

        Channel channel = channelRepository.findFirstByBrandIdAndPlatform(brand.getId(), normalizedPlatform)
                .orElseGet(() -> Channel.builder()
                        .brand(brand)
                        .platform(normalizedPlatform)
                        .build());

        channel.setExternalId(request.getExternalId());
        if (request.getBotToken() != null && !request.getBotToken().isBlank()) {
            channel.setEncryptedToken(request.getBotToken());
        } else if (channel.getEncryptedToken() == null) {
            channel.setEncryptedToken("demo-token-" + normalizedPlatform.toLowerCase());
        }
        channel.setStatus("CONNECTED");
        channel = channelRepository.save(channel);

        return ResponseEntity.ok(ChannelResponse.builder()
                .id(channel.getId())
                .platform(channel.getPlatform())
                .externalId(channel.getExternalId())
                .status(channel.getStatus())
                .build());
    }
}
