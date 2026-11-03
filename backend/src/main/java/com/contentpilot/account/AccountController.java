package com.contentpilot.account;

import com.contentpilot.auth.AuthDto;
import com.contentpilot.auth.AuthService;
import com.contentpilot.auth.User;
import com.contentpilot.auth.UserRepository;
import com.contentpilot.brand.Brand;
import com.contentpilot.brand.BrandRepository;
import com.contentpilot.campaign.CampaignRepository;
import com.contentpilot.post.PostRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
@Tag(name = "Account", description = "Профиль, безопасность, настройки, данные и удаление аккаунта")
public class AccountController {

    private static final long MAX_AVATAR_BYTES = 2 * 1024 * 1024;
    private static final List<String> ALLOWED_AVATAR_TYPES = List.of("image/png", "image/jpeg", "image/webp");

    private final AuthService authService;
    private final UserRepository userRepository;
    private final BrandRepository brandRepository;
    private final CampaignRepository campaignRepository;
    private final PostRepository postRepository;
    private final com.contentpilot.publisher.ChannelRepository channelRepository;

    @Value("${app.creative.storage-dir:./uploads/creative}")
    private String storageDir;

    @GetMapping("/me")
    @Operation(summary = "Текущий профиль пользователя")
    public ResponseEntity<AuthDto.UserInfo> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.getProfile(user.getId()));
    }

    @PutMapping("/me")
    @Operation(summary = "Обновить отображаемое имя профиля")
    public ResponseEntity<AuthDto.UserInfo> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestBody AuthDto.UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(user.getId(), request));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Загрузить/заменить фото профиля (png/jpg/webp, до 2 МБ)")
    public ResponseEntity<AuthDto.UserInfo> uploadAvatar(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл не выбран");
        }
        String type = file.getContentType();
        if (type == null || !ALLOWED_AVATAR_TYPES.contains(type.toLowerCase(Locale.ROOT))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Поддерживаются PNG, JPEG и WEBP");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Файл больше 2 МБ");
        }

        String extension = switch (type.toLowerCase(Locale.ROOT)) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };

        Path storageFolder = avatarsFolder(storageDir);
        Files.createDirectories(storageFolder);

        try (var stream = Files.list(storageFolder)) {
            stream.filter(p -> p.getFileName().toString().startsWith("avatar-" + user.getId() + "."))
                    .forEach(p -> p.toFile().delete());
        }

        String fileName = "avatar-" + user.getId() + "." + extension;
        file.transferTo(storageFolder.resolve(fileName).toFile());

        User entity = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        entity.setAvatarUrl("/uploads/avatars/" + fileName);
        userRepository.save(entity);

        return ResponseEntity.ok(authService.getProfile(user.getId()));
    }

    @DeleteMapping("/avatar")
    @Operation(summary = "Удалить фото профиля")
    public ResponseEntity<AuthDto.UserInfo> deleteAvatar(@AuthenticationPrincipal User user) {
        User entity = userRepository.findById(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        if (entity.getAvatarUrl() != null) {
            String name = Paths.get(entity.getAvatarUrl()).getFileName().toString();
            try {
                Files.deleteIfExists(avatarsFolder(storageDir).resolve(name));
            } catch (Exception e) {
                log.warn("Failed to delete avatar file {}: {}", name, e.getMessage());
            }
            entity.setAvatarUrl(null);
            userRepository.save(entity);
        }
        return ResponseEntity.ok(authService.getProfile(user.getId()));
    }

    // ---------- Security ----------

    @PostMapping("/password")
    @Operation(summary = "Смена пароля (для аккаунтов с парольным входом)")
    public ResponseEntity<AuthDto.MessageResponse> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody AuthDto.ChangePasswordRequest request) {
        authService.changePassword(user.getId(), request);
        AuthDto.MessageResponse response = new AuthDto.MessageResponse();
        response.setMessage("Пароль изменён. Все активные сессии завершены — войдите заново с новым паролем.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Запрос ссылки восстановления пароля (публичный)")
    public ResponseEntity<AuthDto.MessageResponse> forgotPassword(@Valid @RequestBody AuthDto.ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Установка нового пароля по одноразовому токену (публичный)")
    public ResponseEntity<AuthDto.MessageResponse> resetPassword(@Valid @RequestBody AuthDto.ResetPasswordRequest request) {
        authService.resetPassword(request);
        AuthDto.MessageResponse response = new AuthDto.MessageResponse();
        response.setMessage("Пароль установлен. Теперь можно войти с новым паролем.");
        return ResponseEntity.ok(response);
    }

    // ---------- Settings ----------

    @GetMapping("/settings")
    @Operation(summary = "Настройки пользователя, синхронизируемые между устройствами")
    public ResponseEntity<AuthDto.UserSettingsDto> getSettings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(AuthDto.UserSettingsDto.from(authService.getSettings(user.getId())));
    }

    @PutMapping("/settings")
    @Operation(summary = "Обновить настройки пользователя")
    public ResponseEntity<AuthDto.UserSettingsDto> updateSettings(
            @AuthenticationPrincipal User user,
            @RequestBody AuthDto.UserSettingsDto request) {
        com.contentpilot.auth.UserSettings incoming = com.contentpilot.auth.UserSettings.builder()
                .userId(user.getId())
                .language(request.getLanguage())
                .timezone(request.getTimezone())
                .notifyPublishFailed(request.getNotifyPublishFailed())
                .notifyGenerationCompleted(request.getNotifyGenerationCompleted())
                .notifyReviewRequired(request.getNotifyReviewRequired())
                .build();
        return ResponseEntity.ok(AuthDto.UserSettingsDto.from(authService.updateSettings(user.getId(), incoming)));
    }

    // ---------- Data ----------

    @GetMapping("/export")
    @Transactional(readOnly = true)
    @Operation(summary = "Экспорт всех данных пользователя в JSON")
    public ResponseEntity<Map<String, Object>> exportData(@AuthenticationPrincipal User user) {
        Map<String, Object> export = new LinkedHashMap<>();
        export.put("profile", authService.getProfile(user.getId()));

        List<Brand> brands = brandRepository.findAllByUserId(user.getId());
        export.put("brands", brands);

        List<Map<String, Object>> brandContent = brands.stream().map(brand -> {
            Map<String, Object> block = new LinkedHashMap<>();
            block.put("brandId", brand.getId());
            block.put("brandName", brand.getName());
            block.put("channels", channelRepository.findByBrandId(brand.getId()).stream()
                    .map(ch -> Map.of(
                            "platform", ch.getPlatform(),
                            "externalId", ch.getExternalId(),
                            "status", ch.getStatus()))
                    .toList());
            var campaigns = campaignRepository.findByBrandIdOrderByCreatedAtDesc(brand.getId());
            block.put("campaigns", campaigns.stream().map(campaign -> {
                Map<String, Object> campaignBlock = new LinkedHashMap<>();
                campaignBlock.put("id", campaign.getId());
                campaignBlock.put("goal", campaign.getGoal());
                campaignBlock.put("status", campaign.getStatus());
                campaignBlock.put("posts", postRepository.findByCampaignIdOrderByScheduledAtAsc(campaign.getId()));
                return campaignBlock;
            }).toList());
            return block;
        }).toList();
        export.put("brandContent", brandContent);

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=contentpilot-export.json")
                .body(export);
    }

    @DeleteMapping("/me")
    @Transactional
    @Operation(summary = "Удалить аккаунт со всеми брендами, кампаниями и публикациями")
    public ResponseEntity<Void> deleteAccount(
            @AuthenticationPrincipal User user,
            @RequestBody AuthDto.DeleteAccountRequest request) {
        authService.deleteAccount(user.getId(), request.getConfirmation());
        return ResponseEntity.noContent().build();
    }

    private static Path avatarsFolder(String creativeStorageDir) {
        Path creativePath = Paths.get(creativeStorageDir).toAbsolutePath();
        Path uploadsRoot = creativePath.getParent() != null ? creativePath.getParent() : creativePath;
        return uploadsRoot.resolve("avatars");
    }
}
