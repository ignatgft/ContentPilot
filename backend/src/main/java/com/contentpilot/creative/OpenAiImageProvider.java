package com.contentpilot.creative;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiImageProvider implements ImageGenerationProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.openai.api-key:}")
    private String openAiApiKey;

    @Override
    public String getProviderName() {
        return "OPENAI_DALLE3";
    }

    @Override
    public boolean isAvailable() {
        return openAiApiKey != null && !openAiApiKey.isBlank() && !openAiApiKey.startsWith("your-");
    }

    @Override
    public ImageGenerationResult generateImage(ImageGenerationRequest request) throws Exception {
        log.info("Generating image via OpenAI DALL-E 3 for prompt: {}", request.getPrompt());

        // Map aspect ratio to DALL-E 3 supported sizes
        String size = "1024x1024";
        int width = 1024;
        int height = 1024;
        if ("9:16".equals(request.getAspectRatio()) || "4:5".equals(request.getAspectRatio())) {
            size = "1024x1792";
            width = 1024;
            height = 1792;
        } else if ("16:9".equals(request.getAspectRatio())) {
            size = "1792x1024";
            width = 1792;
            height = 1024;
        }

        // Construct high-yield marketing prompt
        StringBuilder detailedPrompt = new StringBuilder();
        detailedPrompt.append("Professional commercial advertising photography, high-end studio lighting, 8k resolution. ");
        if (request.getStyle() != null && !request.getStyle().isBlank()) {
            detailedPrompt.append("Visual style: ").append(request.getStyle()).append(". ");
        }
        detailedPrompt.append("Subject: ").append(request.getPrompt()).append(". ");
        if (request.getBrandTone() != null) {
            detailedPrompt.append("Mood & atmosphere: ").append(request.getBrandTone()).append(". ");
        }
        detailedPrompt.append("Clean composition, photorealistic textures, no artificial watermark, no distorted text.");

        Map<String, Object> body = Map.of(
                "model", "dall-e-3",
                "prompt", detailedPrompt.toString(),
                "n", 1,
                "size", size,
                "response_format", "b64_json",
                "quality", "standard"
        );

        String responseJson = restClient.post()
                .uri("https://api.openai.com/v1/images/generations")
                .header("Authorization", "Bearer " + openAiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode dataArray = root.path("data");
        if (dataArray.isArray() && !dataArray.isEmpty()) {
            String b64 = dataArray.get(0).path("b64_json").asText();
            if (b64 != null && !b64.isBlank()) {
                byte[] bytes = Base64.getDecoder().decode(b64);
                return ImageGenerationResult.builder()
                        .imageBytes(bytes)
                        .mimeType("image/png")
                        .width(width)
                        .height(height)
                        .providerName(getProviderName())
                        .modelName("dall-e-3")
                        .build();
            }
        }

        throw new IllegalStateException("OpenAI did not return b64_json data");
    }
}
