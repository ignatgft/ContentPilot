package com.contentpilot.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    List<UserSession> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    Optional<UserSession> findByIdAndUserId(UUID id, Long userId);

    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :revokedAt WHERE s.user.id = :userId AND s.revokedAt IS NULL")
    int revokeAllForUser(@Param("userId") Long userId, @Param("revokedAt") OffsetDateTime revokedAt);

    @Modifying
    @Query("UPDATE UserSession s SET s.revokedAt = :revokedAt WHERE s.refreshTokenHash = :hash AND s.revokedAt IS NULL")
    int revokeByHash(@Param("hash") String hash, @Param("revokedAt") OffsetDateTime revokedAt);
}
