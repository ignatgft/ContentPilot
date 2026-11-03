package com.contentpilot.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findFirstByTokenHashAndUsedAtIsNullOrderByCreatedAtDesc(String tokenHash);

    List<PasswordResetToken> findAllByUserIdAndUsedAtIsNull(Long userId);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.user.id = :userId AND t.usedAt IS NULL")
    void deleteUnusedForUser(@Param("userId") Long userId);
}
