package com.contentpilot.creative;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FallbackImageProviderTest {

    private final FallbackImageProvider provider = new FallbackImageProvider();

    @Test
    @DisplayName("Should generate square (1:1), vertical (9:16), and landscape (16:9) visuals")
    void testSupportedAspectRatios() throws Exception {
        // 1:1
        ImageGenerationResult square = provider.generateImage(ImageGenerationRequest.builder()
                .prompt("Ароматный эспрессо")
                .aspectRatio("1:1")
                .build());
        assertThat(square.getWidth()).isEqualTo(1080);
        assertThat(square.getHeight()).isEqualTo(1080);
        assertThat(square.getMimeType()).isEqualTo("image/png");

        // 9:16
        ImageGenerationResult vertical = provider.generateImage(ImageGenerationRequest.builder()
                .prompt("Карамельный раф")
                .aspectRatio("9:16")
                .build());
        assertThat(vertical.getWidth()).isEqualTo(1080);
        assertThat(vertical.getHeight()).isEqualTo(1920);

        // 16:9
        ImageGenerationResult landscape = provider.generateImage(ImageGenerationRequest.builder()
                .prompt("Баннер открытия кофейни")
                .aspectRatio("16:9")
                .build());
        assertThat(landscape.getWidth()).isEqualTo(1920);
        assertThat(landscape.getHeight()).isEqualTo(1080);
    }
}
