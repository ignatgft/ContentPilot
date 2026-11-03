package com.contentpilot.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Регистрация, вход и сессии")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Регистрация нового пользователя")
    public ResponseEntity<AuthDto.AuthResponse> register(
            @Valid @RequestBody AuthDto.RegisterRequest request,
            @RequestHeader(value = "X-Client", required = false) String clientHeader,
            HttpServletResponse response) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request, clientHeader, response));
    }

    @PostMapping("/login")
    @Operation(summary = "Вход по почте и паролю")
    public ResponseEntity<AuthDto.AuthResponse> login(
            @Valid @RequestBody AuthDto.LoginRequest request,
            @RequestHeader(value = "X-Client", required = false) String clientHeader,
            HttpServletResponse response) {
        return ResponseEntity.ok(authService.login(request, clientHeader, response));
    }

    @PostMapping("/google")
    @Operation(summary = "Вход через Google ID токен")
    public ResponseEntity<AuthDto.AuthResponse> googleLogin(
            @Valid @RequestBody AuthDto.GoogleLoginRequest request,
            @RequestHeader(value = "X-Client", required = false) String clientHeader,
            HttpServletResponse response) {
        return ResponseEntity.ok(authService.googleLogin(request, clientHeader, response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Обновление access токена через refresh токен (тело для мобильных или cookie для web)")
    public ResponseEntity<AuthDto.AuthResponse> refresh(
            @RequestBody(required = false) AuthDto.RefreshTokenRequest request,
            @RequestHeader(value = "X-Client", required = false) String clientHeader,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        String refreshToken = request != null ? request.getRefreshToken() : null;
        return ResponseEntity.ok(authService.refresh(refreshToken, clientHeader, httpRequest, response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Выход: отзывает текущую сессию на сервере и чистит cookie")
    public ResponseEntity<Void> logout(
            @RequestBody(required = false) AuthDto.RefreshTokenRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        String refreshToken = request != null ? request.getRefreshToken() : null;
        authService.logout(refreshToken, httpRequest, response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout-all")
    @Operation(summary = "Выход со всех устройств")
    public ResponseEntity<AuthDto.MessageResponse> logoutAll(@AuthenticationPrincipal User user) {
        int revoked = authService.logoutAll(user.getId());
        AuthDto.MessageResponse response = new AuthDto.MessageResponse();
        response.setMessage("Активные сессии завершены: " + revoked);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sessions")
    @Operation(summary = "Список активных сессий (refresh токен можно передать телом для mobile)")
    public ResponseEntity<List<AuthDto.SessionResponse>> getSessions(
            @AuthenticationPrincipal User user,
            @RequestBody(required = false) AuthDto.RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        String current = null;
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            current = request.getRefreshToken();
        } else if (httpRequest.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : httpRequest.getCookies()) {
                if (AuthService.REFRESH_COOKIE.equals(c.getName())) {
                    current = c.getValue();
                    break;
                }
            }
        }
        final String currentToken = current;
        return ResponseEntity.ok(authService.getActiveSessions(user.getId()).stream()
                .map(s -> authService.toSessionDto(s, currentToken))
                .toList());
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Завершить конкретную сессию")
    public ResponseEntity<Void> revokeSession(
            @AuthenticationPrincipal User user,
            @PathVariable UUID sessionId) {
        authService.revokeSession(user.getId(), sessionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/ping")
    @Operation(summary = "Проверка доступности сервера для мобильного приложения")
    public ResponseEntity<java.util.Map<String, Object>> ping() {
        return ResponseEntity.ok(java.util.Map.of(
                "status", "OK",
                "service", "contentpilot",
                "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/me")
    @Operation(summary = "Текущий аутентифицированный пользователь")
    public ResponseEntity<AuthDto.UserInfo> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(AuthDto.UserInfo.fromUser(user));
    }
}
