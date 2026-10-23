package com.contentpilot.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByBrandIdOrderByCreatedAtDesc(Long brandId);
}
