package com.contentpilot.scheduler;

import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import com.contentpilot.publisher.Publisher;
import com.contentpilot.publisher.PublisherRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublisherScheduler {

    private final PostRepository postRepository;
    private final PublisherRegistry publisherRegistry;
    private final PostPublishingExecutor publishingExecutor;

    @Scheduled(fixedRate = 60000)
    public void processScheduledPosts() {
        recoverStalePublishing();

        OffsetDateTime now = OffsetDateTime.now();
        List<Post> duePosts = postRepository.findDueForPublishing(now);

        if (duePosts.isEmpty()) {
            return;
        }

        log.info("Found {} scheduled posts ready for publishing across platforms", duePosts.size());

        for (Post post : duePosts) {
            try {
                publishingExecutor.publishPostAtomically(post.getId());
            } catch (Exception e) {
                log.error("Unexpected error publishing post {}: {}", post.getId(), e.getMessage(), e);
            }
        }
    }

    @Scheduled(fixedRate = 300000)
    public void syncPublishedMetrics() {
        List<Post> publishedPosts = postRepository.findAll().stream()
                .filter(p -> "PUBLISHED".equals(p.getStatus()))
                .toList();

        for (Post post : publishedPosts) {
            Publisher publisher = publisherRegistry.getPublisher(post.getPlatform());
            if (publisher != null) {
                publishingExecutor.syncMetricsForPost(post, publisher);
            }
        }
    }

    private void recoverStalePublishing() {
        try {
            OffsetDateTime staleThreshold = OffsetDateTime.now().minusMinutes(5);
            List<Post> stale = postRepository.findStalePublishing(staleThreshold);
            for (Post p : stale) {
                log.warn("Recovering stale PUBLISHING post {} (scheduled at {}) -> setting to FAILED with timeout notice", p.getId(), p.getScheduledAt());
                p.setStatus("FAILED");
                p.setError("Превышено время ожидания ответа социальной сети (таймаут)");
                postRepository.save(p);
            }
        } catch (Exception e) {
            log.warn("Error checking stale publishing posts: {}", e.getMessage());
        }
    }
}
