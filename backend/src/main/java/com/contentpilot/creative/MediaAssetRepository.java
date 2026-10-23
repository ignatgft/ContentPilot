package com.contentpilot.creative;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {
    List<MediaAsset> findByBrandIdOrderByCreatedAtDesc(Long brandId);
    List<MediaAsset> findByBrandIdAndMediaTypeOrderByCreatedAtDesc(Long brandId, CreativeType mediaType);
}
