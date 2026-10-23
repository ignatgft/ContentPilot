package com.contentpilot.creative;

import com.contentpilot.auth.User;
import com.contentpilot.post.Post;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/creative")
@RequiredArgsConstructor
public class CreativeStudioController {

    private final CreativeStudioService creativeStudioService;

    @PostMapping("/images")
    public ResponseEntity<CreativeDto.CreativeTaskResponse> generateImage(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long brandId,
            @RequestBody CreativeDto.CreateImageRequest request) {
        return ResponseEntity.ok(creativeStudioService.generateImage(user, brandId, request));
    }

    @PostMapping("/videos")
    public ResponseEntity<CreativeDto.CreativeTaskResponse> createVideoTask(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long brandId,
            @RequestBody CreativeDto.CreateVideoRequest request) {
        return ResponseEntity.ok(creativeStudioService.createVideoTask(user, brandId, request));
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<CreativeDto.CreativeTaskResponse> getTaskStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(creativeStudioService.getTaskStatus(user, id));
    }

    @GetMapping("/media")
    public ResponseEntity<List<CreativeDto.MediaAssetResponse>> getBrandMedia(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) CreativeType type) {
        return ResponseEntity.ok(creativeStudioService.getBrandMedia(user, brandId, type));
    }

    @PostMapping("/media/{id}/attach-post")
    public ResponseEntity<Post> attachMediaToPost(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CreativeDto.AttachToPostRequest request) {
        return ResponseEntity.ok(creativeStudioService.attachMediaToPost(user, id, request));
    }

    @GetMapping("/presets")
    public ResponseEntity<List<CreativeDto.CreativePreset>> getPresets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(creativeStudioService.getCreativePresets(user));
    }
}
