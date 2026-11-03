package com.contentpilot.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    public static final String CLAIM_TYPE = "type";
    public static final String CLAIM_JTI = "jti";
    public static final String CLAIM_SID = "sid";
    public static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:contentpilot-hackathon-super-secret-key-32bytes-min-len}") String secret,
            @Value("${app.jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs,
            @Value("${app.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    public String generateAccessToken(Long userId, String email) {
        return generateAccessToken(userId, email, null);
    }

    public String generateAccessToken(Long userId, String email, UUID sessionId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + accessTokenExpirationMs);

        var builder = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key);
        if (sessionId != null) {
            builder.claim(CLAIM_SID, sessionId.toString());
        }
        return builder.compact();
    }

    public String generateRefreshToken(Long userId, UUID jti) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + refreshTokenExpirationMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(CLAIM_TYPE, TYPE_REFRESH)
                .claim(CLAIM_JTI, jti.toString())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserIdFromToken(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public UUID getJtiFromToken(String token) {
        String jti = parseClaims(token).get(CLAIM_JTI, String.class);
        return jti == null ? null : UUID.fromString(jti);
    }

    public UUID getSessionIdFromToken(String token) {
        try {
            String sid = parseClaims(token).get(CLAIM_SID, String.class);
            return sid == null ? null : UUID.fromString(sid);
        } catch (Exception ex) {
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    /** Signature-valid access JWT (counterpart for validating content-only claims). */
    public boolean isAccessToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return claims.get(CLAIM_TYPE, String.class) == null
                    || !TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Refresh tokens must be explicitly typed. This prevents access JWTs from being
     * replayed against the refresh endpoint and enables the server-side session registry.
     */
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class))
                    && claims.get(CLAIM_JTI, String.class) != null;
        } catch (Exception ex) {
            return false;
        }
    }
}
