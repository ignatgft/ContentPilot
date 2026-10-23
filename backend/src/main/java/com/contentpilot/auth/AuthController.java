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

@RestController
@RequestMapping("/api/v1/auth")
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
        String refreshToken = null;
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshToken = request.getRefreshToken();
        } else if (httpRequest.getCookies() != null) {
            for (Cookie c : httpRequest.getCookies()) {
                if ("refresh_token".equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }
        return ResponseEntity.ok(authService.refresh(refreshToken, clientHeader, response));
    }

    @PostMapping("/logout")
    @Operation(summary = "Выход из системы")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        authService.logout(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Текущий аутентифицированный пользователь")
    public ResponseEntity<AuthDto.UserInfo> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AuthDto.UserInfo info = new AuthDto.UserInfo();
        info.setId(user.getId());
        info.setEmail(user.getEmail());
        return ResponseEntity.ok(info);
    }
}
