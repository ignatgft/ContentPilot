package com.contentpilot.brand;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;
    private final BrandSampleRepository sampleRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public BrandDto.Response getBrandByUserId(Long userId) {
        Brand brand = brandRepository.findByUserId(userId)
                .orElse(null);
        if (brand == null) {
            return null;
        }
        return toDto(brand);
    }

    @Transactional
    public BrandDto.Response createOrUpdateBrand(Long userId, BrandDto.Request request) {
        Brand brand = brandRepository.findByUserId(userId)
                .orElseGet(() -> Brand.builder().userId(userId).build());

        brand.setName(request.getName());
        brand.setDescription(request.getDescription());
        brand.setAudience(request.getAudience());
        brand.setTone(request.getTone());
        if (request.getAutonomyMode() != null) {
            brand.setAutonomyMode(request.getAutonomyMode());
        }

        try {
            if (request.getFacts() != null) {
                if (request.getFacts() instanceof String str) {
                    brand.setFacts(str);
                } else {
                    brand.setFacts(objectMapper.writeValueAsString(request.getFacts()));
                }
            }
        } catch (Exception e) {
            brand.setFacts("{}");
        }

        brand = brandRepository.save(brand);

        // Update samples if provided
        if (request.getSamples() != null) {
            brand.getSamples().clear();
            for (String sampleText : request.getSamples()) {
                if (sampleText != null && !sampleText.isBlank()) {
                    BrandSample sample = BrandSample.builder()
                            .brand(brand)
                            .text(sampleText)
                            .build();
                    brand.getSamples().add(sample);
                }
            }
            brand = brandRepository.save(brand);
        }

        return toDto(brand);
    }

    private BrandDto.Response toDto(Brand brand) {
        Object parsedFacts = null;
        try {
            if (brand.getFacts() != null) {
                parsedFacts = objectMapper.readValue(brand.getFacts(), Object.class);
            }
        } catch (Exception e) {
            parsedFacts = brand.getFacts();
        }

        List<String> samples = brand.getSamples().stream()
                .map(BrandSample::getText)
                .toList();

        return BrandDto.Response.builder()
                .id(brand.getId())
                .userId(brand.getUserId())
                .name(brand.getName())
                .description(brand.getDescription())
                .audience(brand.getAudience())
                .tone(brand.getTone())
                .facts(parsedFacts)
                .autonomyMode(brand.getAutonomyMode())
                .samples(samples)
                .build();
    }
}
