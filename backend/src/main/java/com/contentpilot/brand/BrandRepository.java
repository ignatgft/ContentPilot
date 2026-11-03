package com.contentpilot.brand;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    /** Legacy dev databases may hold duplicate brand rows per user — always take the newest. */
    Optional<Brand> findFirstByUserIdOrderByIdDesc(Long userId);
    List<Brand> findAllByUserId(Long userId);
}
