package com.contentpilot.scheduler;

import com.contentpilot.analytics.PostMetrics;
import com.contentpilot.analytics.PostMetricsRepository;
import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import com.contentpilot.publisher.Publisher;
import com.contentpilot.publisher.PublisherRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostPublishingExecutor {

    private final PostRepository postRepository;
    private final PublisherRegistry publisherRegistry;
    private final PostMetricsRepository metricsRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void publishPostAtomically(Long postId) {
        Post post = postRepository.findById(postId).orElse(null);
        if (post == null || !"SCHEDULED".equals(post.getStatus())) {
            return;
        }

        post.setStatus("PUBLISHING");
        postRepository.saveAndFlush(post);

        Publisher publisher = publisherRegistry.getPublisher(post.getPlatform());
        if (publisher == null) {
            log.warn("No publisher registered for platform '{}' (post {}). Marking as FAILED.", post.getPlatform(), post.getId());
            post.setStatus("FAILED");
            post.setError("Площадка «" + post.getPlatform() + "» не поддерживается интеграциями публикации");
            postRepository.save(post);
            return;
        }

        try {
            boolean publishedSuccess = publisher.publish(post);
            postRepository.save(post);

            if (publishedSuccess && "PUBLISHED".equals(post.getStatus())) {
                syncMetricsForPost(post, publisher);
            }
        } catch (Exception e) {
            log.error("Exception executing publisher for post {}: {}", post.getId(), e.getMessage());
            post.setStatus("FAILED");
            post.setError("Ошибка отправки публикации: " + e.getMessage());
            postRepository.save(post);
        }
    }

    public void syncMetricsForPost(Post post, Publisher publisher) {
        try {
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
