package com.contentpilot.analytics;

import com.contentpilot.auth.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Аналитика публикаций и рекомендации")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/overview")
    @Operation(summary = "Сводка аналитики и рекомендации на основе реальных данных")
    public ResponseEntity<AnalyticsDto.OverviewResponse> getOverview(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(analyticsService.getOverview(user.getId()));
    }
}
