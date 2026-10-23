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
@Tag(name = "Channels", description = "Подключение Telegram каналов и внешних площадок")
public class ChannelController {

    private final ChannelRepository channelRepository;
    private final BrandRepository brandRepository;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConnectChannelRequest {
        @NotBlank(message = "ID канала обязателен (например, @my_coffee_bar)")
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

    @PostMapping("/telegram")
    @Operation(summary = "Подключить Telegram канал")
    public ResponseEntity<ChannelResponse> connectTelegram(
            @AuthenticationPrincipal User user,
            @RequestBody ConnectChannelRequest request) {
        Brand brand = brandRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сначала создайте бренд"));

        Channel channel = channelRepository.findFirstByBrandIdAndPlatform(brand.getId(), "TELEGRAM")
                .orElseGet(() -> Channel.builder()
                        .brand(brand)
                        .platform("TELEGRAM")
                        .build());

        channel.setExternalId(request.getExternalId());
        if (request.getBotToken() != null && !request.getBotToken().isBlank()) {
            channel.setEncryptedToken(request.getBotToken());
        } else if (channel.getEncryptedToken() == null) {
            channel.setEncryptedToken("default-demo-token");
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
