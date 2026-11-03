package com.contentpilot.creative;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CreativePresetsTest {

    private final CreativeStudioService service = new CreativeStudioService(
            null, null, null, null, null, null, null, null, null, null
    );

    @Test
    @DisplayName("Should supply rich business presets covering product, reels, sale banner, and lifestyle shots")
    void testGetPresets() {
        List<CreativeDto.CreativePreset> presets = service.getCreativePresets();
        assertThat(presets).isNotEmpty();
        assertThat(presets.size()).isGreaterThanOrEqualTo(4);

        // Check product preset (square)
        CreativeDto.CreativePreset productPreset = presets.stream()
                .filter(p -> "product-hero-shot".equals(p.getId()))
                .findFirst()
                .orElse(null);
        assertThat(productPreset).isNotNull();
        assertThat(productPreset.getDefaultAspectRatio()).isEqualTo("1:1");
        assertThat(productPreset.getSuggestedBadge()).isNotBlank();
        assertThat(productPreset.getSuggestedCta()).isNotBlank();

        // Check vertical video preset (9:16)
        CreativeDto.CreativePreset reelsPreset = presets.stream()
                .filter(p -> "reels-vertical-promo".equals(p.getId()))
                .findFirst()
                .orElse(null);
        assertThat(reelsPreset).isNotNull();
        assertThat(reelsPreset.getDefaultAspectRatio()).isEqualTo("9:16");
    }
}
