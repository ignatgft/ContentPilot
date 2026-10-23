package com.contentpilot.campaign;

import com.contentpilot.brand.Brand;
import com.contentpilot.brand.BrandRepository;
import com.contentpilot.generation.ClaudeGenerationService;
import com.contentpilot.post.Post;
import com.contentpilot.post.PostDto;
import com.contentpilot.post.PostRepository;
import com.contentpilot.verification.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final BrandRepository brandRepository;
    private final PostRepository postRepository;
    private final ClaudeGenerationService generationService;
    private final VerificationService verificationService;

    @Transactional
    public CampaignDto.Response createCampaign(Long userId, CampaignDto.CreateRequest request) {
        Brand brand = brandRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сначала заполните профиль бренда"));

        LocalDate start = request.getPeriodStart() != null ? request.getPeriodStart() : LocalDate.now();
        LocalDate end = request.getPeriodEnd() != null ? request.getPeriodEnd() : start.plusDays(7);
        int duration = (int) Math.max(1, ChronoUnit.DAYS.between(start, end));

        Campaign campaign = Campaign.builder()
                .brand(brand)
                .goal(request.getGoal())
                .periodStart(start)
                .periodEnd(end)
                .status("ACTIVE")
                .build();

        campaign = campaignRepository.save(campaign);

        // Generate posts
        List<ClaudeGenerationService.GeneratedPost> generatedPosts = generationService.generateCampaignPosts(brand, request.getGoal(), duration);

        for (ClaudeGenerationService.GeneratedPost gen : generatedPosts) {
            OffsetDateTime postTime = start.plusDays(gen.getDayOffset()).atTime(10, 0).atOffset(ZoneOffset.UTC);

            Post post = Post.builder()
                    .campaign(campaign)
                    .platform(gen.getPlatform())
                    .text(gen.getText())
                    .mediaUrl(gen.getMediaUrl())
                    .status("DRAFT")
                    .scheduledAt(postTime)
                    .build();

            post = postRepository.save(post);
            verificationService.verifyPost(post);
            campaign.getPosts().add(post);
        }

        return toDto(campaign);
    }

    @Transactional(readOnly = true)
    public List<CampaignDto.Response> getCampaigns(Long userId) {
        Brand brand = brandRepository.findByUserId(userId).orElse(null);
        if (brand == null) return List.of();

        return campaignRepository.findByBrandIdOrderByCreatedAtDesc(brand.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public CampaignDto.Response getCampaignById(Long userId, Long campaignId) {
        Campaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Кампания не найдена"));

        if (!campaign.getBrand().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет доступа к кампании");
        }

        return toDto(campaign);
    }

    public CampaignDto.Response toDto(Campaign campaign) {
        List<PostDto.Response> postDtos = campaign.getPosts().stream()
                .map(this::toPostDto)
                .toList();

        return CampaignDto.Response.builder()
                .id(campaign.getId())
                .brandId(campaign.getBrand().getId())
                .goal(campaign.getGoal())
                .periodStart(campaign.getPeriodStart())
                .periodEnd(campaign.getPeriodEnd())
                .status(campaign.getStatus())
                .createdAt(campaign.getCreatedAt())
                .posts(postDtos)
                .build();
    }

    public PostDto.Response toPostDto(Post post) {
        List<PostDto.VerificationResponse> verificationResponses = post.getVerificationResults().stream()
                .map(v -> PostDto.VerificationResponse.builder()
                        .id(v.getId())
                        .checkType(v.getCheckType())
                        .status(v.getStatus())
                        .message(v.getMessage())
                        .build())
                .toList();

        return PostDto.Response.builder()
                .id(post.getId())
                .campaignId(post.getCampaign().getId())
                .platform(post.getPlatform())
                .text(post.getText())
                .mediaUrl(post.getMediaUrl())
                .status(post.getStatus())
                .scheduledAt(post.getScheduledAt())
                .publishedAt(post.getPublishedAt())
                .error(post.getError())
                .createdAt(post.getCreatedAt())
                .verificationResults(verificationResponses)
                .build();
    }
}
