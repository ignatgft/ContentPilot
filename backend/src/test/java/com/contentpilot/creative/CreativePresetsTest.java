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
    @DisplayName("Should supply rich business presets covering coffee, bakery, Reels, and sale banners")
    void testGetPresets() {
        List<CreativeDto.CreativePreset> presets = service.getCreativePresets();
        assertThat(presets).isNotEmpty();
        assertThat(presets.size()).isGreaterThanOrEqualTo(4);

        // Check coffee preset
        CreativeDto.CreativePreset coffeePreset = presets.stream()
                .filter(p -> "latte-art-cozy".equals(p.getId()))
                .findFirst()
                .orElse(null);
        assertThat(coffeePreset).isNotNull();
        assertThat(coffeePreset.getDefaultAspectRatio()).isEqualTo("1:1");
        assertThat(coffeePreset.getSuggestedBadge()).isNotBlank();
        assertThat(coffeePreset.getSuggestedCta()).isNotBlank();

        // Check vertical video preset (9:16)
        CreativeDto.CreativePreset reelsPreset = presets.stream()
                .filter(p -> "reels-story-special".equals(p.getId()))
                .findFirst()
                .orElse(null);
        assertThat(reelsPreset).isNotNull();
        assertThat(reelsPreset.getDefaultAspectRatio()).isEqualTo("9:16");
    }
}
