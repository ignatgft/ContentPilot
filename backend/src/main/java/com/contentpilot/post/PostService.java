package com.contentpilot.post;

import com.contentpilot.brand.Brand;
import com.contentpilot.brand.BrandRepository;
import com.contentpilot.campaign.CampaignService;
import com.contentpilot.publisher.Publisher;
import com.contentpilot.publisher.PublisherRegistry;
import com.contentpilot.verification.VerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final BrandRepository brandRepository;
    private final VerificationService verificationService;
    private final PublisherRegistry publisherRegistry;
    private final CampaignService campaignService;

    @Transactional(readOnly = true)
    public List<PostDto.Response> getUserPosts(Long userId) {
        return postRepository.findAllByUserId(userId).stream()
                .map(campaignService::toPostDto)
                .toList();
    }

    @Transactional
    public PostDto.Response updatePost(Long userId, Long postId, PostDto.UpdateRequest request) {
        Post post = getPostAndValidateOwner(userId, postId);

        if (request.getText() != null) {
            post.setText(request.getText());
        }
        if (request.getPlatform() != null) {
            post.setPlatform(request.getPlatform());
        }
        if (request.getMediaUrl() != null) {
            post.setMediaUrl(request.getMediaUrl());
        }
        if (request.getScheduledAt() != null) {
            post.setScheduledAt(request.getScheduledAt());
        }

        // Re-run verification automatically upon edit
        verificationService.verifyPost(post);
        post = postRepository.save(post);

        return campaignService.toPostDto(post);
    }

    @Transactional
    public PostDto.Response verifyPost(Long userId, Long postId) {
        Post post = getPostAndValidateOwner(userId, postId);
        verificationService.verifyPost(post);
        return campaignService.toPostDto(post);
    }

    @Transactional
    public PostDto.Response approvePost(Long userId, Long postId) {
        Post post = getPostAndValidateOwner(userId, postId);
        post.setStatus("SCHEDULED");
        post.setError(null);
        post = postRepository.save(post);
        return campaignService.toPostDto(post);
    }

    @Transactional
    public PostDto.Response publishNow(Long userId, Long postId) {
        Post post = getPostAndValidateOwner(userId, postId);
        if ("NEEDS_REVIEW".equals(post.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Заблокированный пост нельзя опубликовать до ручного подтверждения");
        }

        post.setStatus("PUBLISHING");
        postRepository.save(post);

        Publisher publisher = publisherRegistry.getPublisher(post.getPlatform());
        if (publisher != null) {
            publisher.publish(post);
        } else {
            post.setStatus("PUBLISHED");
            postRepository.save(post);
        }
        return campaignService.toPostDto(post);
    }

    @Transactional
    public int stopAllPosts(Long userId) {
        Brand brand = brandRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Бренд не найден"));

        List<Post> scheduled = postRepository.findScheduledByBrandId(brand.getId());
        for (Post p : scheduled) {
            p.setStatus("PAUSED");
            postRepository.save(p);
        }
        return scheduled.size();
    }

    private Post getPostAndValidateOwner(Long userId, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пост не найден"));

        if (!post.getCampaign().getBrand().getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Нет прав на изменение поста");
        }
        return post;
    }
}
