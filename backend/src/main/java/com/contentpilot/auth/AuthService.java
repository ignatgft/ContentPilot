package com.contentpilot.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String REFRESH_COOKIE = "refresh_token";

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final UserSettingsRepository settingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.account.reveal-reset-token:false}")
    private boolean revealResetTokenInResponse;

    @Value("${app.account.reset-token-ttl-minutes:30}")
    private int resetTokenTtlMinutes;

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request, String clientHeader, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Пользователь с такой почтой уже существует");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);
        ensureSettings(user);

        return createAuthResponse(user, clientHeader, response);
    }

    @Transactional
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request, String clientHeader, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверная почта или пароль"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверная почта или пароль");
        }

        return issueTokens(user, clientHeader, response);
    }

    @Transactional
    public AuthDto.AuthResponse googleLogin(AuthDto.GoogleLoginRequest request, String clientHeader, HttpServletResponse response) {
        if (request.getIdToken() == null || request.getIdToken().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google ID токен не предоставлен");
        }

        String googleEmail = null;
        String googleSub = null;

        // Verify with official Google tokeninfo API
        try {
            String tokenInfoJson = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token=" + request.getIdToken())
                    .retrieve()
                    .body(String.class);

            if (tokenInfoJson != null) {
                JsonNode node = objectMapper.readTree(tokenInfoJson);
                if (node.has("email")) {
                    googleEmail = node.get("email").asText();
                }
                if (node.has("sub")) {
                    googleSub = node.get("sub").asText();
                }
            }
        } catch (Exception e) {
            // Fallback to JWT payload verification if network check to Google tokeninfo fails
            if (request.getIdToken().contains(".")) {
                try {
                    String[] parts = request.getIdToken().split("\\.");
                    String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                    JsonNode node = new ObjectMapper().readTree(payload);
                    if (node.has("email") && node.has("sub")) {
                        googleEmail = node.get("email").asText();
                        googleSub = node.get("sub").asText();
                    }
                } catch (Exception ignored) {}
            }
        }

        if (googleEmail == null || googleSub == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Недействительный или истекший Google ID токен");
        }

        final String finalEmail = googleEmail.toLowerCase();
        final String finalSub = googleSub;

        User user = userRepository.findByGoogleSub(finalSub)
                .or(() -> userRepository.findByEmail(finalEmail).map(existingUser -> {
                    existingUser.setGoogleSub(finalSub);
                    return userRepository.save(existingUser);
                }))
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .email(finalEmail)
                                .googleSub(finalSub)
                                .build()
                ));
        ensureSettings(user);

        return issueTokens(user, clientHeader, response);
    }

    @Transactional
    public AuthDto.AuthResponse refresh(String refreshToken, String clientHeader, HttpServletRequest httpRequest, HttpServletResponse response) {
        String resolvedToken = resolveRefreshToken(refreshToken, httpRequest);
        if (resolvedToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Недействительный или истекший refresh-токен");
        }
        if (!tokenProvider.validateToken(resolvedToken) || !tokenProvider.isRefreshToken(resolvedToken)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Недействительный или истекший refresh-токен");
        }

        UUID jti;
        Long userId;
        try {
            jti = tokenProvider.getJtiFromToken(resolvedToken);
            userId = tokenProvider.getUserIdFromToken(resolvedToken);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Недействительный или истекший refresh-токен");
        }

        UserSession session = sessionRepository.findByIdAndUserId(jti, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сессия недействительна. Войдите заново."));

        if (!session.isActive() || !session.getRefreshTokenHash().equals(hashToken(resolvedToken))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Сессия недействительна. Войдите заново.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));

        // Rotate: revoke the used session, mint a new one with a fresh jti
        session.setRevokedAt(OffsetDateTime.now());
        sessionRepository.save(session);

        ensureSettings(user);
        return createAuthResponse(user, clientHeader, response);
    }

    @Transactional
    public void logout(String refreshToken, HttpServletRequest httpRequest, HttpServletResponse response) {
        String token = resolveRefreshToken(refreshToken, httpRequest);
        if (token != null && tokenProvider.validateToken(token)) {
            try {
                UUID jti = tokenProvider.getJtiFromToken(token);
                sessionRepository.findById(jti).ifPresent(session -> {
                    if (session.getRevokedAt() == null) {
                        session.setRevokedAt(OffsetDateTime.now());
                        sessionRepository.save(session);
                    }
                });
            } catch (Exception ignored) {
                // malformed token — nothing to revoke
            }
        }
        clearRefreshCookie(response);
    }

    @Transactional
    public int logoutAll(Long userId) {
        return sessionRepository.revokeAllForUser(userId, OffsetDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<UserSession> getActiveSessions(Long userId) {
        return sessionRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(UserSession::isActive)
                .toList();
    }

    @Transactional
    public void revokeSession(Long userId, UUID sessionId) {
        UserSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Сессия не найдена"));
        if (session.getRevokedAt() == null) {
            session.setRevokedAt(OffsetDateTime.now());
            sessionRepository.save(session);
        }
    }

    public AuthDto.SessionResponse toSessionDto(UserSession session, String currentRefreshToken) {
        AuthDto.SessionResponse dto = new AuthDto.SessionResponse();
        dto.setId(session.getId());
        dto.setClient(session.getClient());
        dto.setCreatedAt(session.getCreatedAt());
        dto.setLastUsedAt(session.getLastUsedAt());
        dto.setExpiresAt(session.getExpiresAt());
        dto.setCurrent(currentRefreshToken != null
                && session.getRefreshTokenHash().equals(hashToken(currentRefreshToken)));
        return dto;
    }

    // ---------- Profile ----------

    @Transactional(readOnly = true)
    public AuthDto.UserInfo getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        return AuthDto.UserInfo.fromUser(user);
    }

    @Transactional
    public AuthDto.UserInfo updateProfile(Long userId, AuthDto.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден"));

        if (request.getDisplayName() != null) {
            String trimmed = request.getDisplayName().trim();
            user.setDisplayName(trimmed.isEmpty() ? null : trimmed);
        }
        userRepository.save(user);
        return AuthDto.UserInfo.fromUser(user);
    }

    // ---------- Security ----------

    @Transactional
    public void changePassword(Long userId, AuthDto.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден"));

        if (user.getPasswordHash() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Аккаунт создан через Google и не имеет пароля. Используйте вход через Google.");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Текущий пароль указан неверно");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Новый пароль совпадает с текущим");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Security policy: after a password change, every issued session is invalidated.
        sessionRepository.revokeAllForUser(userId, OffsetDateTime.now());
    }

    @Transactional
    public AuthDto.MessageResponse forgotPassword(AuthDto.ForgotPasswordRequest request) {
        AuthDto.MessageResponse message = new AuthDto.MessageResponse();
        String generic = "Если такой аккаунт существует, на почту отправлено письмо с ссылкой для восстановления.";

        userRepository.findByEmail(request.getEmail().toLowerCase()).ifPresent(user -> {
            if (user.getPasswordHash() == null) {
                return; // Google-only accounts: nothing to reset, still generic response
            }

            resetTokenRepository.deleteUnusedForUser(user.getId());

            byte[] random = new byte[32];
            secureRandom.nextBytes(random);
            String rawToken = HexFormat.of().formatHex(random);

            try {
                resetTokenRepository.save(PasswordResetToken.builder()
                        .user(user)
                        .tokenHash(hashToken(rawToken))
                        .expiresAt(OffsetDateTime.now().plusMinutes(resetTokenTtlMinutes))
                        .build());
            } catch (Exception e) {
                log.error("Failed to persist password reset token: {}", e.getMessage());
                return;
            }

            String resetLink = "/reset-password?token=" + rawToken;
            log.warn("Password reset requested for user {}. Reset link: {}", user.getId(), resetLink);
            if (revealResetTokenInResponse) {
                message.setDevToken(rawToken);
            }
        });

        message.setMessage(generic);
        return message;
    }

    @Transactional
    public void resetPassword(AuthDto.ResetPasswordRequest request) {
        PasswordResetToken token = resetTokenRepository
                .findFirstByTokenHashAndUsedAtIsNullOrderByCreatedAtDesc(hashToken(request.getToken()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Ссылка недействительна или уже использована"));

        if (token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Срок действия ссылки истёк. Запросите восстановление заново.");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsedAt(OffsetDateTime.now());
        resetTokenRepository.save(token);

        // Reset invalidates existing sessions on all devices
        sessionRepository.revokeAllForUser(user.getId(), OffsetDateTime.now());
    }

    // ---------- Settings ----------

    @Transactional
    public UserSettings ensureSettings(User user) {
        return settingsRepository.findById(user.getId())
                .orElseGet(() -> settingsRepository.save(UserSettings.builder()
                        .userId(user.getId())
                        .build()));
    }

    @Transactional(readOnly = true)
    public UserSettings getSettings(Long userId) {
        return settingsRepository.findById(userId)
                .orElseGet(() -> UserSettings.builder().userId(userId).build());
    }

    @Transactional
    public UserSettings updateSettings(Long userId, UserSettings incoming) {
        UserSettings existing = ensureSettings(userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден")));

        if (incoming.getLanguage() != null) {
            if (!incoming.getLanguage().matches("[a-z]{2}")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректный код языка");
            }
            existing.setLanguage(incoming.getLanguage());
        }
        if (incoming.getTimezone() != null) {
            if (incoming.getTimezone().isBlank() || incoming.getTimezone().length() > 64) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Некорректный часовой пояс");
            }
            existing.setTimezone(incoming.getTimezone());
        }
        if (incoming.getNotifyPublishFailed() != null) {
            existing.setNotifyPublishFailed(incoming.getNotifyPublishFailed());
        }
        if (incoming.getNotifyGenerationCompleted() != null) {
            existing.setNotifyGenerationCompleted(incoming.getNotifyGenerationCompleted());
        }
        if (incoming.getNotifyReviewRequired() != null) {
            existing.setNotifyReviewRequired(incoming.getNotifyReviewRequired());
        }
        existing.setUpdatedAt(OffsetDateTime.now());
        return settingsRepository.save(existing);
    }

    // ---------- Account deletion ----------

    @Transactional
    public void deleteAccount(Long userId, String confirmation) {
        if (!"DELETE".equals(confirmation)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Для удаления отправьте подтверждение: { confirmation: \"DELETE\" }");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        // brands -> campaigns -> posts -> verification/publish log/metrics cascade by FK
        sessionRepository.revokeAllForUser(userId, OffsetDateTime.now());
        resetTokenRepository.deleteUnusedForUser(userId);
        userRepository.delete(user);
    }

    // ---------- Helpers ----------

    private AuthDto.AuthResponse createAuthResponse(User user, String clientHeader, HttpServletResponse response) {
        return issueTokens(user, clientHeader, response);
    }

    private AuthDto.AuthResponse issueTokens(User user, String clientHeader, HttpServletResponse response) {
        UUID jti = UUID.randomUUID();
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail(), jti);
        String refreshToken = tokenProvider.generateRefreshToken(user.getId(), jti);

        String client = "mobile".equalsIgnoreCase(clientHeader) ? "mobile" : "web";
        // The session row is keyed by the refresh token's jti: refresh() looks it up
        // via findByIdAndUserId(jti, userId).
        sessionRepository.save(UserSession.builder()
                .id(jti)
                .user(user)
                .client(client)
                .refreshTokenHash(hashToken(refreshToken))
                .expiresAt(OffsetDateTime.now().plusMinutes(7 * 24 * 60))
                .build());

        boolean isMobile = "mobile".equalsIgnoreCase(clientHeader);
        if (isMobile) {
            return new AuthDto.AuthResponse(accessToken, refreshToken, user);
        }
        setRefreshTokenCookie(response, refreshToken);
        return new AuthDto.AuthResponse(accessToken, user);
    }

    private String resolveRefreshToken(String bodyToken, HttpServletRequest httpRequest) {
        if (bodyToken != null && !bodyToken.isBlank()) {
            return bodyToken;
        }
        if (httpRequest != null && httpRequest.getCookies() != null) {
            for (Cookie c : httpRequest.getCookies()) {
                if (REFRESH_COOKIE.equals(c.getName())) {
                    return c.getValue();
                }
            }
        }
        return null;
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_COOKIE, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_COOKIE, null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
