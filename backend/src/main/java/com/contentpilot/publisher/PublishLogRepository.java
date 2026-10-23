package com.contentpilot.publisher;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PublishLogRepository extends JpaRepository<PublishLog, Long> {
    List<PublishLog> findByPostIdOrderByCreatedAtDesc(Long postId);
}
