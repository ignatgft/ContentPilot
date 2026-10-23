package com.contentpilot.brand;

import com.contentpilot.auth.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/brands")
@RequiredArgsConstructor
@Tag(name = "Brands", description = "Управление профилем бренда")
public class BrandController {

    private final BrandService brandService;

    @GetMapping("/me")
    @Operation(summary = "Получить профиль бренда текущего пользователя")
    public ResponseEntity<BrandDto.Response> getMyBrand(@AuthenticationPrincipal User user) {
        BrandDto.Response response = brandService.getBrandByUserId(user.getId());
        if (response == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Создать или обновить профиль бренда")
    public ResponseEntity<BrandDto.Response> saveBrand(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BrandDto.Request request) {
        return ResponseEntity.ok(brandService.createOrUpdateBrand(user.getId(), request));
    }
}
