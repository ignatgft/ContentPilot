package com.contentpilot.publisher;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ChannelRepository extends JpaRepository<Channel, Long> {
    List<Channel> findByBrandId(Long brandId);
    Optional<Channel> findFirstByBrandIdAndPlatform(Long brandId, String platform);
}
