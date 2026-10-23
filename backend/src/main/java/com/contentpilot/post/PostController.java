package com.contentpilot.post;

import com.contentpilot.auth.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@Tag(name = "Posts", description = "Управление публикациями, ручная проверка и публикация")
public class PostController {

    private final PostService postService;

    @GetMapping
    @Operation(summary = "Получить все посты бренда пользователя")
    public ResponseEntity<List<PostDto.Response>> getUserPosts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(postService.getUserPosts(user.getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Редактировать публикацию и повторно запустить проверку")
    public ResponseEntity<PostDto.Response> updatePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody PostDto.UpdateRequest request) {
        return ResponseEntity.ok(postService.updatePost(user.getId(), id, request));
    }

    @PostMapping("/{id}/verify")
    @Operation(summary = "Принудительная проверка публикации")
    public ResponseEntity<PostDto.Response> verifyPost(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(postService.verifyPost(user.getId(), id));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Ручное подтверждение публикации (перевод из NEEDS_REVIEW в SCHEDULED)")
    public ResponseEntity<PostDto.Response> approvePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(postService.approvePost(user.getId(), id));
    }

    @PostMapping("/{id}/publish-now")
    @Operation(summary = "Немедленная публикация поста в канал")
    public ResponseEntity<PostDto.Response> publishNow(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(postService.publishNow(user.getId(), id));
    }

    @PostMapping("/stop-all")
    @Operation(summary = "Кнопка «Остановить всё»: переводит все запланированные посты в PAUSED")
    public ResponseEntity<Map<String, Object>> stopAll(@AuthenticationPrincipal User user) {
        int pausedCount = postService.stopAllPosts(user.getId());
        return ResponseEntity.ok(Map.of(
                "message", "Все запланированные публикации переведены в режим паузы",
                "pausedPostsCount", pausedCount
        ));
    }
}
