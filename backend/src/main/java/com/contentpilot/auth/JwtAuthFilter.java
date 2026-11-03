package com.contentpilot.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        if (StringUtils.hasText(token) && tokenProvider.validateToken(token) && tokenProvider.isAccessToken(token)) {
            UUID sessionId = tokenProvider.getSessionIdFromToken(token);
            boolean sessionValid = true;
            if (sessionId != null) {
                var sessionOpt = sessionRepository.findById(sessionId);
                if (sessionOpt.isEmpty() || !sessionOpt.get().isActive()) {
                    sessionValid = false;
                }
            }

            if (sessionValid) {
                Long userId = tokenProvider.getUserIdFromToken(token);
                userRepository.findById(userId).ifPresent(user -> {
                    String role = user.getCanteenRole() != null ? user.getCanteenRole().toUpperCase() : "ADMIN";
                    var authorities = java.util.List.of(
                            new SimpleGrantedAuthority("ROLE_" + role),
                            new SimpleGrantedAuthority("ROLE_USER")
                    );
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            authorities
                    );
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                });
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
