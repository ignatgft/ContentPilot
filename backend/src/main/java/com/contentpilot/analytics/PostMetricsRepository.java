package com.contentpilot.analytics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostMetricsRepository extends JpaRepository<PostMetrics, Long> {
    Optional<PostMetrics> findByPostId(Long postId);

    @Query("SELECT pm FROM PostMetrics pm WHERE pm.post.campaign.brand.userId = :userId")
    List<PostMetrics> findAllByUserId(@Param("userId") Long userId);
}
