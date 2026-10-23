package com.contentpilot.brand;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BrandSampleRepository extends JpaRepository<BrandSample, Long> {
    List<BrandSample> findByBrandId(Long brandId);
}
