package com.contentpilot.creative;

import com.contentpilot.auth.User;
import com.contentpilot.brand.Brand;
import com.contentpilot.brand.BrandRepository;
import com.contentpilot.campaign.Campaign;
import com.contentpilot.campaign.CampaignRepository;
import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class CreativeStudioService {

    private final CreativeTaskRepository taskRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final BrandRepository brandRepository;
    private final CampaignRepository campaignRepository;
    private final PostRepository postRepository;

    private final OpenAiImageProvider openAiImageProvider;
    private final ComfyUiImageProvider comfyUiImageProvider;
    private final FallbackImageProvider fallbackImageProvider;
    private final FfmpegVideoProvider ffmpegVideoProvider;
    private final CreativeOverlayRenderer overlayRenderer;

    @Value("${app.creative.storage-dir:./uploads/creative}")
    private String storageDir;

    @Value("${app.ai.image-provider:fallback}")
    private String configuredImageProvider;

    private Brand resolveUserBrand(User user, Long brandId) {
        if (brandId != null) {
            Brand brand = brandRepository.findById(brandId)
                    .orElseThrow(() -> new IllegalArgumentException("Бренд не найден с ID: " + brandId));
            if (user != null && brand.getUserId() != null && !brand.getUserId().equals(user.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN, "Нет доступа к чужому бренду");
            }
            return brand;
        }
        return brandRepository.findFirstByUserIdOrderByIdDesc(user.getId())
                .orElseThrow(() -> new IllegalStateException("У вас нет созданных брендов. Сначала настройте профиль бренда."));
    }

    private void ensureStorageDir() {
        try {
            Path path = Paths.get(storageDir);
            if (!Files.exists(path)) {
                Files.createDirectories(path);
            }
        } catch (Exception e) {
            log.error("Failed to create storage directory: {}", storageDir, e);
        }
    }

    @Transactional
    public CreativeDto.CreativeTaskResponse generateImage(User user, Long brandId, CreativeDto.CreateImageRequest request) {
        Brand brand = resolveUserBrand(user, brandId);
        ensureStorageDir();

        ImageGenerationProvider chosenProvider;
        String target = configuredImageProvider != null ? configuredImageProvider.trim().toLowerCase() : "fallback";

        if ("comfyui".equals(target)) {
            if (comfyUiImageProvider.isAvailable()) {
                chosenProvider = comfyUiImageProvider;
            } else {
                throw new IllegalStateException("ComfyUI сервер недоступен по указанному COMFYUI_BASE_URL. Проверьте сервер или переключите AI_IMAGE_PROVIDER на 'fallback'.");
            }
        } else if ("openai".equals(target) || "dalle".equals(target)) {
            if (openAiImageProvider.isAvailable()) {
                chosenProvider = openAiImageProvider;
            } else {
                throw new IllegalStateException("OpenAI API ключ не настроен. Укажите OPENAI_API_KEY в переменных окружения или переключите AI_IMAGE_PROVIDER на 'fallback'.");
            }
        } else {
            chosenProvider = fallbackImageProvider;
        }

        CreativeTask task = CreativeTask.builder()
                .brand(brand)
                .user(user)
                .type(CreativeType.IMAGE)
                .provider(chosenProvider.getProviderName())
                .model("commercial-v1")
                .prompt(request.getPrompt() != null ? request.getPrompt() : "Рекламный визуал продукта")
                .aspectRatio(request.getAspectRatio() != null ? request.getAspectRatio() : "1:1")
                .style(request.getStyle() != null ? request.getStyle() : "STUDIO_COMMERCIAL")
                .status(CreativeTaskStatus.PROCESSING)
                .progress(25)
                .build();
        task = taskRepository.save(task);

        try {
            // Build generation request with Brand Memory
            ImageGenerationRequest genReq = ImageGenerationRequest.builder()
                    .prompt(task.getPrompt())
                    .aspectRatio(task.getAspectRatio())
                    .style(task.getStyle())
                    .brandName(request.getBrandName() != null ? request.getBrandName() : brand.getName())
                    .brandTone(brand.getTone())
                    .brandDescription(brand.getDescription())
                    .referenceImageUrl(request.getReferenceImageUrl())
                    .build();

            ImageGenerationResult genResult = chosenProvider.generateImage(genReq);

            byte[] imageBytes = genResult.getImageBytes();

            // Deterministic overlay if requested
            if (request.isEnableOverlay() || (request.getPrice() != null && !request.getPrice().isBlank())) {
                imageBytes = overlayRenderer.applyOverlay(
                        imageBytes,
                        request.getBrandName() != null ? request.getBrandName() : brand.getName(),
                        request.getPrice(),
                        request.getBadgeText(),
                        request.getCtaText() != null ? request.getCtaText() : "Заказать",
                        request.getOverlayPosition() != null ? request.getOverlayPosition() : "BOTTOM_CENTER"
                );
            }

            // Save file
            String filename = "img_" + task.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + ".png";
            Path filePath = Paths.get(storageDir, filename);
            Files.write(filePath, imageBytes);

            String url = "/uploads/creative/" + filename;

            task.setStatus(CreativeTaskStatus.COMPLETED);
            task.setProgress(100);
            task.setResultUrl(url);
            taskRepository.save(task);

            // Register media asset
            MediaAsset asset = MediaAsset.builder()
                    .brand(brand)
                    .task(task)
                    .mediaType(CreativeType.IMAGE)
                    .url(url)
                    .thumbnailUrl(url)
                    .prompt(task.getPrompt())
                    .style(task.getStyle())
                    .aspectRatio(task.getAspectRatio())
                    .width(genResult.getWidth())
                    .height(genResult.getHeight())
                    .build();
            mediaAssetRepository.save(asset);

            return toTaskResponse(task);

        } catch (Exception e) {
            log.error("Image generation failed for task {}", task.getId(), e);
            task.setStatus(CreativeTaskStatus.FAILED);
            task.setErrorMessage(e.getMessage());
            taskRepository.save(task);
            return toTaskResponse(task);
        }
    }

    @Transactional
    public CreativeDto.CreativeTaskResponse createVideoTask(User user, Long brandId, CreativeDto.CreateVideoRequest request) {
        Brand brand = resolveUserBrand(user, brandId);
        ensureStorageDir();

        CreativeTask task = CreativeTask.builder()
                .brand(brand)
                .user(user)
                .type(CreativeType.VIDEO)
                .provider(ffmpegVideoProvider.getProviderName())
                .model("ffmpeg-zoom-v1")
                .prompt(request.getPrompt() != null ? request.getPrompt() : "Рекламный ролик для сторис/Reels")
                .aspectRatio(request.getAspectRatio() != null ? request.getAspectRatio() : "9:16")
                .style(request.getStyle() != null ? request.getStyle() : "STUDIO_COMMERCIAL")
                .status(CreativeTaskStatus.PENDING)
                .progress(5)
                .build();
        task = taskRepository.saveAndFlush(task);

        final Long taskId = task.getId();
        final Long brandIdVal = brand.getId();

        // Run asynchronously
        CompletableFuture.runAsync(() -> processVideoAsync(taskId, brandIdVal, request));

        return toTaskResponse(task);
    }

    public void processVideoAsync(Long taskId, Long brandId, CreativeDto.CreateVideoRequest request) {
        try {
            Thread.sleep(200);
            CreativeTask task = taskRepository.findById(taskId).orElse(null);
            Brand brand = brandRepository.findById(brandId).orElse(null);
            if (task == null || brand == null) {
                log.warn("Task {} or Brand {} not found in async video processor", taskId, brandId);
                return;
            }

            task.setStatus(CreativeTaskStatus.PROCESSING);
            task.setProgress(30);
            taskRepository.saveAndFlush(task);

            VideoGenerationRequest vidReq = VideoGenerationRequest.builder()
                    .prompt(task.getPrompt())
                    .aspectRatio(task.getAspectRatio())
                    .durationSeconds(request.getDurationSeconds() > 0 ? request.getDurationSeconds() : 5)
                    .style(task.getStyle())
                    .cameraMotion(request.getCameraMotion())
                    .referenceImageUrl(request.getReferenceImageUrl())
                    .brandName(request.getBrandName() != null ? request.getBrandName() : brand.getName())
                    .badgeText(request.getBadgeText())
                    .price(request.getPrice())
                    .build();

            VideoGenerationResult result = ffmpegVideoProvider.generateVideo(vidReq);

            task.setProgress(75);
            taskRepository.save(task);

            // Save video file
            String ext = "video/mp4".equals(result.getMimeType()) ? ".mp4" : ".png";
            String videoFilename = "vid_" + task.getId() + "_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path videoPath = Paths.get(storageDir, videoFilename);
            Files.write(videoPath, result.getVideoBytes());

            // Save thumbnail
            String thumbFilename = "thumb_" + task.getId() + ".png";
            Path thumbPath = Paths.get(storageDir, thumbFilename);
            Files.write(thumbPath, result.getThumbnailBytes());

            String videoUrl = "/uploads/creative/" + videoFilename;
            String thumbUrl = "/uploads/creative/" + thumbFilename;

            task.setStatus(CreativeTaskStatus.COMPLETED);
            task.setProgress(100);
            task.setResultUrl(videoUrl);
            taskRepository.save(task);

            MediaAsset asset = MediaAsset.builder()
                    .brand(brand)
                    .task(task)
                    .mediaType(CreativeType.VIDEO)
                    .url(videoUrl)
                    .thumbnailUrl(thumbUrl)
                    .prompt(task.getPrompt())
                    .style(task.getStyle())
                    .aspectRatio(task.getAspectRatio())
                    .width(result.getWidth())
                    .height(result.getHeight())
                    .durationSeconds(result.getDurationSeconds())
                    .build();
            mediaAssetRepository.save(asset);

            log.info("Video generation completed for task {}", taskId);

        } catch (Exception e) {
            log.error("Video task processing error for taskId {}", taskId, e);
            taskRepository.findById(taskId).ifPresent(t -> {
                t.setStatus(CreativeTaskStatus.FAILED);
                t.setErrorMessage(e.getMessage());
                taskRepository.save(t);
            });
        }
    }

    @Transactional(readOnly = true)
    public CreativeDto.CreativeTaskResponse getTaskStatus(User user, Long taskId) {
        CreativeTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Задача не найдена с ID: " + taskId));
        if (user != null && task.getUser() != null && !task.getUser().getId().equals(user.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Нет доступа к чужой задаче генерации"
            );
        }
        return toTaskResponse(task);
    }

    @Transactional(readOnly = true)
    public List<CreativeDto.MediaAssetResponse> getBrandMedia(User user, Long brandId, CreativeType type) {
        Brand brand = resolveUserBrand(user, brandId);
        List<MediaAsset> list;
        if (type != null) {
            list = mediaAssetRepository.findByBrandIdAndMediaTypeOrderByCreatedAtDesc(brand.getId(), type);
        } else {
            list = mediaAssetRepository.findByBrandIdOrderByCreatedAtDesc(brand.getId());
        }
        return list.stream().map(this::toMediaResponse).toList();
    }

    @Transactional
    public Post attachMediaToPost(User user, Long mediaId, CreativeDto.AttachToPostRequest request) {
        MediaAsset media = mediaAssetRepository.findById(mediaId)
                .orElseThrow(() -> new IllegalArgumentException("Медиа-ассет не найден с ID: " + mediaId));

        if (user == null || media.getBrand() == null || media.getBrand().getUserId() == null
                || !media.getBrand().getUserId().equals(user.getId())) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Нет доступа к этому медиа-ассету");
        }

        if (request.getPostId() != null) {
            Post post = postRepository.findById(request.getPostId())
                    .orElseThrow(() -> new IllegalArgumentException("Пост не найден с ID: " + request.getPostId()));
            if (post.getCampaign() == null || post.getCampaign().getBrand() == null
                    || !post.getCampaign().getBrand().getUserId().equals(user.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN, "Нет прав на изменение поста");
            }
            post.setMediaUrl(media.getUrl());
            return postRepository.save(post);
        }

        // Create new post in campaign
        Campaign campaign;
        if (request.getCampaignId() != null) {
            campaign = campaignRepository.findById(request.getCampaignId())
                    .orElseThrow(() -> new IllegalArgumentException("Кампания не найдена"));
            if (campaign.getBrand() == null || !campaign.getBrand().getUserId().equals(user.getId())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.FORBIDDEN, "Нет прав на эту кампанию");
            }
        } else {
            List<Campaign> campaigns = campaignRepository.findByBrandIdOrderByCreatedAtDesc(media.getBrand().getId());
            if (campaigns.isEmpty()) {
                campaign = Campaign.builder()
                        .brand(media.getBrand())
                        .goal("AI Студия — Рекламные публикации")
                        .status("ACTIVE")
                        .build();
                campaign = campaignRepository.save(campaign);
            } else {
                campaign = campaigns.get(0);
            }
        }

        String platform = request.getPlatform() != null ? request.getPlatform().toUpperCase() : "TELEGRAM";
        String caption = request.getPostText();
        if (caption == null || caption.isBlank()) {
            caption = media.getPrompt() != null ? media.getPrompt() : "Новое специальное предложение от " + media.getBrand().getName();
        }

        Post newPost = Post.builder()
                .campaign(campaign)
                .platform(platform)
                .text(caption)
                .mediaUrl(media.getUrl())
                .status("DRAFT")
                .build();

        return postRepository.save(newPost);
    }

    public List<CreativeDto.CreativePreset> getCreativePresets() {
        return getCreativePresets(null);
    }

    public List<CreativeDto.CreativePreset> getCreativePresets(User user) {
        List<CreativeDto.CreativePreset> presets = new ArrayList<>();

        if (user != null) {
            brandRepository.findFirstByUserIdOrderByIdDesc(user.getId()).ifPresent(brand -> {
                try {
                    if (brand.getFacts() != null && !brand.getFacts().isBlank()) {
                        com.fasterxml.jackson.databind.JsonNode factsNode = new com.fasterxml.jackson.databind.ObjectMapper().readTree(brand.getFacts());
                        com.fasterxml.jackson.databind.JsonNode menuNode = factsNode.path("menu");
                        if (menuNode.isArray()) {
                            for (com.fasterxml.jackson.databind.JsonNode item : menuNode) {
                                String name = item.path("name").asText("");
                                int price = item.path("price").asInt(0);
                                if (!name.isBlank() && price > 0) {
                                    presets.add(CreativeDto.CreativePreset.builder()
                                            .id("brand-item-" + Math.abs(name.hashCode()))
                                            .title(name + " (" + price + " ₽)")
                                            .description("Позиция из меню " + (brand.getName() != null ? brand.getName() : ""))
                                            .prompt(String.format("Профессиональная студийная съёмка позиции %s, аппетитная подача, мягкий естественный свет, чистый фон",
                                                    name))
                                            .style("STUDIO_COMMERCIAL")
                                            .defaultAspectRatio("1:1")
                                            .suggestedBadge("Хит продаж")
                                            .suggestedPrice(price + " ₽")
                                            .suggestedCta("Заказать")
                                            .category("Меню бренда")
                                            .build());
                                    if (presets.size() >= 3) break;
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    log.debug("No custom brand presets parsed: {}", e.getMessage());
                }
            });
        }

        presets.addAll(getBasePresets());
        return presets;
    }

    private List<CreativeDto.CreativePreset> getBasePresets() {
        return List.of(
                CreativeDto.CreativePreset.builder()
                        .id("product-hero-shot")
                        .title("Товар крупным планом")
                        .description("Ключевой продукт на чистом фоне со студийным светом")
                        .prompt("Профессиональная студийная съёмка продукта на чистом светлом фоне, мягкие тени, акцент на деталях и текстуре")
                        .style("STUDIO_COMMERCIAL")
                        .defaultAspectRatio("1:1")
                        .suggestedBadge("Хит продаж")
                        .suggestedCta("Заказать")
                        .category("Продукт")
                        .build(),
                CreativeDto.CreativePreset.builder()
                        .id("reels-vertical-promo")
                        .title("Вертикальный промо-ролик (9:16)")
                        .description("Динамичный Reels / Shorts формат для сторис и клипов")
                        .prompt("Вертикальный кинематографичный кадр продукта крупным планом, глубокий фон, профессиональное студийное освещение")
                        .style("DARK_LUXURY")
                        .defaultAspectRatio("9:16")
                        .suggestedBadge("Акция дня")
                        .suggestedCta("Смотреть")
                        .category("Reels & Shorts")
                        .build(),
                CreativeDto.CreativePreset.builder()
                        .id("retail-sale-banner")
                        .title("Рекламный баннер акции")
                        .description("Широкоформатный баннер для сайта и постов ВКонтакте (16:9)")
                        .prompt("Минималистичная композиция товаров на дизайнерском подиуме с геометрическими фигурами и яркими акцентами")
                        .style("VIBRANT_POP")
                        .defaultAspectRatio("16:9")
                        .suggestedBadge("Скидка 20%")
                        .suggestedPrice("-20%")
                        .suggestedCta("В каталог")
                        .category("Баннеры")
                        .build(),
                CreativeDto.CreativePreset.builder()
                        .id("lifestyle-mood")
                        .title("Лайфстайл-атмосфера")
                        .description("Публичное место бренда в уютном естественном свете")
                        .prompt("Интерьер с мягким естественным светом, уютная атмосфера, люди наслаждаются моментом, тёплые тона")
                        .style("MINIMALIST")
                        .defaultAspectRatio("4:5")
                        .suggestedBadge("Атмосфера")
                        .suggestedCta("Заходите")
                        .category("Лайфстайл")
                        .build()
        );
    }

    private CreativeDto.CreativeTaskResponse toTaskResponse(CreativeTask task) {
        return CreativeDto.CreativeTaskResponse.builder()
                .id(task.getId())
                .type(task.getType())
                .provider(task.getProvider())
                .model(task.getModel())
                .prompt(task.getPrompt())
                .aspectRatio(task.getAspectRatio())
                .style(task.getStyle())
                .status(task.getStatus())
                .progress(task.getProgress())
                .resultUrl(task.getResultUrl())
                .errorMessage(task.getErrorMessage())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private CreativeDto.MediaAssetResponse toMediaResponse(MediaAsset asset) {
        return CreativeDto.MediaAssetResponse.builder()
                .id(asset.getId())
                .taskId(asset.getTask() != null ? asset.getTask().getId() : null)
                .mediaType(asset.getMediaType())
                .url(asset.getUrl())
                .thumbnailUrl(asset.getThumbnailUrl())
                .prompt(asset.getPrompt())
                .style(asset.getStyle())
                .aspectRatio(asset.getAspectRatio())
                .width(asset.getWidth())
                .height(asset.getHeight())
                .durationSeconds(asset.getDurationSeconds())
                .createdAt(asset.getCreatedAt())
                .build();
    }
}
