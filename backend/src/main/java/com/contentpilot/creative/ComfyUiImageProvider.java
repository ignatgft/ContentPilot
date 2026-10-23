package com.contentpilot.creative;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ComfyUiImageProvider implements ImageGenerationProvider {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.comfyui-base-url:http://comfyui:8188}")
    private String comfyUiBaseUrl;

    @Override
    public String getProviderName() {
        return "comfyui";
    }

    @Override
    public boolean isAvailable() {
        try {
            String stats = restClient.get()
                    .uri(comfyUiBaseUrl + "/system_stats")
                    .retrieve()
                    .body(String.class);
            return stats != null && stats.contains("system");
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public ImageGenerationResult generateImage(ImageGenerationRequest request) {
        if (!isAvailable()) {
            throw new IllegalStateException("ComfyUI сервер недоступен по адресу: " + comfyUiBaseUrl + ". Убедитесь, что сервис запущен.");
        }

        String promptId = UUID.randomUUID().toString();
        log.info("Dispatching ComfyUI workflow (FLUX.1 schnell) for prompt: {}", request.getPrompt());

        // Basic FLUX.1 schnell / SD text-to-image ComfyUI API payload
        Map<String, Object> workflow = Map.of(
                "3", Map.of(
                        "class_type", "KSampler",
                        "inputs", Map.of(
                                "cfg", 3.5,
                                "denoise", 1.0,
                                "latent_image", List.of("5", 0),
                                "model", List.of("4", 0),
                                "positive", List.of("6", 0),
                                "negative", List.of("7", 0),
                                "sampler_name", "euler",
                                "scheduler", "simple",
                                "seed", System.currentTimeMillis() % 1000000000L,
                                "steps", 4
                        )
                ),
                "4", Map.of("class_type", "CheckpointLoaderSimple", "inputs", Map.of("ckpt_name", "flux1-schnell.safetensors")),
                "5", Map.of("class_type", "EmptyLatentImage", "inputs", Map.of("batch_size", 1, "height", 1024, "width", 1024)),
                "6", Map.of("class_type", "CLIPTextEncode", "inputs", Map.of("clip", List.of("4", 1), "text", request.getPrompt())),
                "7", Map.of("class_type", "CLIPTextEncode", "inputs", Map.of("clip", List.of("4", 1), "text", "blurry, low quality, distorted")),
                "8", Map.of("class_type", "VAEDecode", "inputs", Map.of("samples", List.of("3", 0), "vae", List.of("4", 2))),
                "9", Map.of("class_type", "SaveImage", "inputs", Map.of("filename_prefix", "ContentPilot", "images", List.of("8", 0)))
        );

        Map<String, Object> payload = Map.of(
                "prompt", workflow,
                "client_id", promptId
        );

        try {
            String postResponse = restClient.post()
                    .uri(comfyUiBaseUrl + "/prompt")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(String.class);

            JsonNode respNode = objectMapper.readTree(postResponse);
            String promptUid = respNode.path("prompt_id").asText();

            // Poll history until completed
            for (int i = 0; i < 30; i++) {
                Thread.sleep(1000);
                String historyJson = restClient.get()
                        .uri(comfyUiBaseUrl + "/history/" + promptUid)
                        .retrieve()
                        .body(String.class);

                JsonNode historyNode = objectMapper.readTree(historyJson);
                if (historyNode.has(promptUid)) {
                    JsonNode outputs = historyNode.path(promptUid).path("outputs").path("9").path("images");
                    if (outputs.isArray() && outputs.size() > 0) {
                        String filename = outputs.get(0).path("filename").asText();
                        String subfolder = outputs.get(0).path("subfolder").asText("");

                        // Download generated image
                        byte[] imageBytes = restClient.get()
                                .uri(comfyUiBaseUrl + "/view?filename=" + filename + "&subfolder=" + subfolder)
                                .retrieve()
                                .body(byte[].class);

                        return ImageGenerationResult.builder()
                                .imageBytes(imageBytes)
                                .mimeType("image/png")
                                .width(1024)
                                .height(1024)
                                .providerName("comfyui")
                                .modelName("flux1-schnell")
                                .build();
                    }
                }
            }
            throw new RuntimeException("Таймаут генерации изображения в ComfyUI");

        } catch (Exception e) {
            log.error("ComfyUI generation failed: {}", e.getMessage());
            throw new RuntimeException("Ошибка ComfyUI: " + e.getMessage(), e);
        }
    }
}
