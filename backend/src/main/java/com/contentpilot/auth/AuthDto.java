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
            this.user = new UserInfo();
            this.user.setId(user.getId());
            this.user.setEmail(user.getEmail());
        }
    }
}
