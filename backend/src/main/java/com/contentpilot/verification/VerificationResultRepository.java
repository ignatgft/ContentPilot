package com.contentpilot.verification;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VerificationResultRepository extends JpaRepository<VerificationResult, Long> {
    List<VerificationResult> findByPostId(Long postId);
    void deleteByPostId(Long postId);
}
