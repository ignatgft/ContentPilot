package com.contentpilot.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Пользователь с такой почтой уже существует");
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());
        setRefreshTokenCookie(response, refreshToken);

        return new AuthDto.AuthResponse(accessToken, user);
    }

    @Transactional(readOnly = true)
    public AuthDto.AuthResponse login(AuthDto.LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверная почта или пароль"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверная почта или пароль");
        }

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());
        setRefreshTokenCookie(response, refreshToken);

        return new AuthDto.AuthResponse(accessToken, user);
    }

    @Transactional
    public AuthDto.AuthResponse googleLogin(AuthDto.GoogleLoginRequest request, HttpServletResponse response) {
        // Mock / Parse Google token: extract subject and email
        // In hackathon / dev mode, we support standard JWT decoding or mock
        String googleEmail;
        String googleSub;
        try {
            // If the token is a mock or JWT
            if (request.getIdToken().contains(".")) {
                String[] parts = request.getIdToken().split("\\.");
                String payload = new String(java.util.Base64.getUrlDecoder().decode(parts[1]));
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(payload);
                googleEmail = node.has("email") ? node.get("email").asText() : "google.user@example.com";
                googleSub = node.has("sub") ? node.get("sub").asText() : "google_" + System.currentTimeMillis();
            } else {
                googleEmail = "google.user@contentpilot.app";
                googleSub = "google_sub_" + request.getIdToken().hashCode();
            }
        } catch (Exception e) {
            googleEmail = "google.user@contentpilot.app";
            googleSub = "google_sub_default";
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

        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());
        setRefreshTokenCookie(response, refreshToken);

        return new AuthDto.AuthResponse(accessToken, user);
    }

    public void logout(HttpServletResponse response) {
        Cookie cookie = new Cookie("refresh_token", null);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(cookie);
    }
}
