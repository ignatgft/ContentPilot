package com.contentpilot.scheduler;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import com.contentpilot.publisher.TelegramPublisherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublisherScheduler {

    private final PostRepository postRepository;
    private final TelegramPublisherService telegramPublisherService;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processScheduledPosts() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Post> duePosts = postRepository.findDueForPublishing(now);

        if (duePosts.isEmpty()) {
            return;
        }

        log.info("Found {} scheduled posts ready for publishing", duePosts.size());

        for (Post post : duePosts) {
            // Atomic status update to prevent duplicate publication
            post.setStatus("PUBLISHING");
            postRepository.save(post);

            if ("TELEGRAM".equalsIgnoreCase(post.getPlatform())) {
                telegramPublisherService.publishToTelegram(post);
            } else {
                // For other platforms (VK, Instagram), prepare for manual download per TZ Section 9
                post.setStatus("PUBLISHED");
                post.setPublishedAt(now);
                postRepository.save(post);
            }
        }
    }
}
