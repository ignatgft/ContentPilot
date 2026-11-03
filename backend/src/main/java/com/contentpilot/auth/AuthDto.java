 package com.contentpilot.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Почта обязательна")
        @Email(message = "Некорректный формат почты")
        private String email;

        @NotBlank(message = "Пароль обязателен")
        @Pattern(regexp = "^(?=.*[A-Za-zА-Яа-я])(?=.*\\d).{8,}$",
                 message = "Пароль должен содержать минимум 8 символов, включая буквы и цифры")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @NotBlank(message = "Почта обязательна")
        @Email(message = "Некорректный формат почты")
        private String email;

        @NotBlank(message = "Пароль обязателен")
        private String password;
    }

    @Data
    public static class GoogleLoginRequest {
        @NotBlank(message = "Токен Google обязателен")
        private String idToken;
    }

    @Data
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh-токен обязателен")
        private String refreshToken;
    }

    @Data
    public static class UserInfo {
        private Long id;
        private String email;
        private String displayName;
        private String avatarUrl;
        private String provider;
        private java.time.OffsetDateTime registeredAt;

        public static UserInfo fromUser(User user) {
            UserInfo info = new UserInfo();
            info.setId(user.getId());
            info.setEmail(user.getEmail());
            info.setDisplayName(user.getDisplayName());
            info.setAvatarUrl(user.getAvatarUrl());
            if (user.getPasswordHash() != null && user.getGoogleSub() != null) {
                info.setProvider("password+google");
            } else if (user.getGoogleSub() != null) {
                info.setProvider("google");
            } else {
                info.setProvider("password");
            }
            info.setRegisteredAt(user.getCreatedAt());
            return info;
        }
    }

    @Data
    public static class UpdateProfileRequest {
        @jakarta.validation.constraints.Size(max = 120, message = "Имя — до 120 символов")
        private String displayName;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Текущий пароль обязателен")
        private String currentPassword;

        @NotBlank(message = "Новый пароль обязателен")
        @Pattern(regexp = "^(?=.*[A-Za-zА-Яа-я])(?=.*\\d).{8,}$",
                 message = "Пароль должен содержать минимум 8 символов, включая буквы и цифры")
        private String newPassword;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Почта обязательна")
        @Email(message = "Некорректный формат почты")
        private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank(message = "Токен восстановления обязателен")
        private String token;

        @NotBlank(message = "Новый пароль обязателен")
        @Pattern(regexp = "^(?=.*[A-Za-zА-Яа-я])(?=.*\\d).{8,}$",
                 message = "Пароль должен содержать минимум 8 символов, включая буквы и цифры")
        private String newPassword;
    }

    @Data
    public static class UserSettingsDto {
        private String language;
        private String timezone;
        private Boolean notifyPublishFailed;
        private Boolean notifyGenerationCompleted;
        private Boolean notifyReviewRequired;

        public static UserSettingsDto from(UserSettings s) {
            UserSettingsDto dto = new UserSettingsDto();
            dto.setLanguage(s.getLanguage());
            dto.setTimezone(s.getTimezone());
            dto.setNotifyPublishFailed(Boolean.TRUE.equals(s.getNotifyPublishFailed()));
            dto.setNotifyGenerationCompleted(Boolean.TRUE.equals(s.getNotifyGenerationCompleted()));
            dto.setNotifyReviewRequired(Boolean.TRUE.equals(s.getNotifyReviewRequired()));
            return dto;
        }
    }

    @Data
    public static class SessionResponse {
        private java.util.UUID id;
        private String client;
        private boolean current;
        private java.time.OffsetDateTime createdAt;
        private java.time.OffsetDateTime lastUsedAt;
        private java.time.OffsetDateTime expiresAt;
    }

    @Data
    public static class MessageResponse {
        private String message;
        private String devToken;
    }

    @Data
    public static class DeleteAccountRequest {
        @NotBlank(message = "Подтверждение обязательно")
        private String confirmation;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String refreshToken;
        private UserInfo user;

        public AuthResponse(String token, User user) {
            this(token, null, user);
        }

        public AuthResponse(String token, String refreshToken, User user) {
            this.token = token;
            this.refreshToken = refreshToken;
            this.user = UserInfo.fromUser(user);
        }
    }
}
