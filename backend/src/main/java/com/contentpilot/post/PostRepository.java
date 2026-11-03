package com.contentpilot.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByCampaignIdOrderByScheduledAtAsc(Long campaignId);
    
    @Query("SELECT p FROM Post p WHERE p.campaign.brand.userId = :userId ORDER BY p.scheduledAt ASC, p.createdAt DESC")
    List<Post> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT p FROM Post p WHERE p.campaign.brand.id = :brandId AND p.status = 'SCHEDULED'")
    List<Post> findScheduledByBrandId(@Param("brandId") Long brandId);

    @Query("SELECT p FROM Post p WHERE p.status = 'SCHEDULED' AND p.scheduledAt <= :now")
    List<Post> findDueForPublishing(@Param("now") OffsetDateTime now);

    @Query("SELECT p FROM Post p WHERE p.status = 'PUBLISHING' AND (p.scheduledAt <= :threshold OR p.createdAt <= :threshold)")
    List<Post> findStalePublishing(@Param("threshold") OffsetDateTime threshold);
}
