package com.contentpilot.campaign;

import com.contentpilot.auth.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/campaigns")
@RequiredArgsConstructor
@Tag(name = "Campaigns", description = "Управление кампаниями и генерация постов")
public class CampaignController {

    private final CampaignService campaignService;

    @PostMapping
    @Operation(summary = "Создать кампанию и сгенерировать публикации")
    public ResponseEntity<CampaignDto.Response> createCampaign(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CampaignDto.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(campaignService.createCampaign(user.getId(), request));
    }

    @GetMapping
    @Operation(summary = "Список кампаний текущего бренда")
    public ResponseEntity<List<CampaignDto.Response>> getCampaigns(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(campaignService.getCampaigns(user.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить кампанию по ID")
    public ResponseEntity<CampaignDto.Response> getCampaignById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(campaignService.getCampaignById(user.getId(), id));
    }
}
