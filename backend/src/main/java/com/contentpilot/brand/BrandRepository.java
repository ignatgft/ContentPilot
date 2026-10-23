package com.contentpilot.brand;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface BrandRepository extends JpaRepository<Brand, Long> {
    Optional<Brand> findByUserId(Long userId);
    List<Brand> findAllByUserId(Long userId);
}
