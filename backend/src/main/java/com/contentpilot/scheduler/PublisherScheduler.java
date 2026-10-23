package com.contentpilot.scheduler;

import com.contentpilot.analytics.PostMetrics;
import com.contentpilot.analytics.PostMetricsRepository;
import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import com.contentpilot.publisher.Publisher;
import com.contentpilot.publisher.PublisherRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublisherScheduler {

    private final PostRepository postRepository;
    private final PublisherRegistry publisherRegistry;
    private final PostMetricsRepository metricsRepository;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processScheduledPosts() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Post> duePosts = postRepository.findDueForPublishing(now);

        if (duePosts.isEmpty()) {
            return;
        }

        log.info("Found {} scheduled posts ready for publishing across platforms", duePosts.size());

        for (Post post : duePosts) {
            // Atomic status update to prevent duplicate publication
            post.setStatus("PUBLISHING");
            postRepository.save(post);

            Publisher publisher = publisherRegistry.getPublisher(post.getPlatform());
            boolean publishedSuccess = false;
            if (publisher != null) {
                publishedSuccess = publisher.publish(post);
            } else {
                post.setStatus("PUBLISHED");
                post.setPublishedAt(now);
                postRepository.save(post);
                publishedSuccess = true;
            }

            if (publishedSuccess) {
                syncMetricsForPost(post);
            }
        }
    }

    @Scheduled(fixedRate = 300000)
    @Transactional
    public void syncPublishedMetrics() {
        List<Post> publishedPosts = postRepository.findAll().stream()
                .filter(p -> "PUBLISHED".equals(p.getStatus()))
                .toList();

        for (Post post : publishedPosts) {
            syncMetricsForPost(post);
        }
    }

    private void syncMetricsForPost(Post post) {
        try {
            Publisher publisher = publisherRegistry.getPublisher(post.getPlatform());
            if (publisher != null) {
                Map<String, Integer> metrics = publisher.fetchMetrics(post);
                if (metrics != null && !metrics.isEmpty()) {
                    int views = metrics.getOrDefault("views", 0);
                    int reactions = metrics.getOrDefault("reactions", 0);
                    int clicks = metrics.getOrDefault("clicks", 0);

                    PostMetrics pm = metricsRepository.findByPostId(post.getId())
                            .orElseGet(() -> PostMetrics.builder()
                                    .post(post)
                                    .build());

                    pm.setViews(views);
                    pm.setReactions(reactions);
                    pm.setClicks(clicks);
                    pm.setCollectedAt(OffsetDateTime.now());
                    metricsRepository.save(pm);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to collect metrics for post {}: {}", post.getId(), e.getMessage());
        }
    }
}
