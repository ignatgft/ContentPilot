package com.contentpilot.creative;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CreativeTaskRepository extends JpaRepository<CreativeTask, Long> {
    List<CreativeTask> findByBrandIdOrderByCreatedAtDesc(Long brandId);
    List<CreativeTask> findByStatus(CreativeTaskStatus status);
}
