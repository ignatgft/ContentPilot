package com.contentpilot.analytics;

import com.contentpilot.brand.BrandRepository;
import com.contentpilot.post.Post;
import com.contentpilot.post.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final PostRepository postRepository;
    private final PostMetricsRepository metricsRepository;
    private final BrandRepository brandRepository;

    @Transactional(readOnly = true)
    public AnalyticsDto.OverviewResponse getOverview(Long userId) {
        List<Post> posts = postRepository.findAllByUserId(userId);
        if (posts.isEmpty()) {
            return AnalyticsDto.OverviewResponse.builder()
                    .totalPosts(0)
                    .publishedPosts(0)
                    .totalViews(0)
                    .totalReactions(0)
                    .totalClicks(0)
                    .hasData(false)
                    .summaryMessage("Данные аналитики пока отсутствуют. Создайте и опубликуйте первую публикацию.")
                    .recommendations(List.of("Запустите первую маркетинговую кампанию для сбора статистики."))
                    .topPosts(List.of())
                    .build();
        }

        List<PostMetrics> allMetrics = metricsRepository.findAllByUserId(userId);
        int publishedCount = (int) posts.stream().filter(p -> "PUBLISHED".equals(p.getStatus())).count();

        if (allMetrics.isEmpty() && publishedCount == 0) {
            return AnalyticsDto.OverviewResponse.builder()
                    .totalPosts(posts.size())
                    .publishedPosts(0)
                    .totalViews(0)
                    .totalReactions(0)
                    .totalClicks(0)
                    .hasData(false)
                    .summaryMessage("Публикации запланированы, но ещё не вышли в эфир. Данные появятся после первых просмотров.")
                    .recommendations(List.of(
                            "Убедитесь, что Telegram-канал подключен и бот добавлен в администраторы.",
                            "Проверьте время выхода постов в календаре."
                    ))
                    .topPosts(List.of())
                    .build();
        }

        // Calculate real metrics strictly from PostMetrics repository
        int totalViews = 0;
        int totalReactions = 0;
        int totalClicks = 0;
        List<AnalyticsDto.PostMetricDetail> metricDetails = new ArrayList<>();

        for (PostMetrics m : allMetrics) {
            totalViews += m.getViews();
            totalReactions += m.getReactions();
            totalClicks += m.getClicks();
            metricDetails.add(AnalyticsDto.PostMetricDetail.builder()
                    .postId(m.getPost().getId())
                    .platform(m.getPost().getPlatform())
                    .text(m.getPost().getText())
                    .views(m.getViews())
                    .reactions(m.getReactions())
                    .clicks(m.getClicks())
                    .build());
        }

        if (allMetrics.isEmpty()) {
            return AnalyticsDto.OverviewResponse.builder()
                    .totalPosts(posts.size())
                    .publishedPosts(publishedCount)
                    .totalViews(0)
                    .totalReactions(0)
                    .totalClicks(0)
                    .hasData(false)
                    .summaryMessage("Публикации вышли в эфир. Аналитика строится только на показателях, доступных API площадок — как только площадка отдаёт статистику, она появится здесь.")
                    .recommendations(List.of(
                            "Telegram Bot API не отдаёт просмотры канала — метрики появятся, когда подключенные площадки откроют доступ к статистике.",
                            "Используйте раздел «Кампании», чтобы воспроизвести контент с наибольшим откликом."
                    ))
                    .topPosts(List.of())
                    .build();
        }

        List<String> recommendations = buildDataDrivenRecommendations(posts, metricDetails);

        return AnalyticsDto.OverviewResponse.builder()
                .totalPosts(posts.size())
                .publishedPosts(publishedCount)
                .totalViews(totalViews)
                .totalReactions(totalReactions)
                .totalClicks(totalClicks)
                .hasData(true)
                .summaryMessage(String.format(
                        "Собрано реальных данных по %d публикациям: %d просмотров, %d реакций, %d переходов.",
                        metricDetails.size(), totalViews, totalReactions, totalClicks))
                .recommendations(recommendations)
                .topPosts(metricDetails)
                .build();
    }

    /**
     * Recommendations are derived strictly from the measured data: no invented benchmarks.
     */
    private List<String> buildDataDrivenRecommendations(List<Post> posts, List<AnalyticsDto.PostMetricDetail> metricDetails) {
        List<String> recommendations = new ArrayList<>();

        long totalViews = metricDetails.stream().mapToLong(AnalyticsDto.PostMetricDetail::getViews).sum();
        long totalClicks = metricDetails.stream().mapToLong(AnalyticsDto.PostMetricDetail::getClicks).sum();
        long totalReactions = metricDetails.stream().mapToLong(AnalyticsDto.PostMetricDetail::getReactions).sum();

        // Aggregates per platform
        Map<String, long[]> byPlatform = new LinkedHashMap<>();
        for (AnalyticsDto.PostMetricDetail m : metricDetails) {
            long[] agg = byPlatform.computeIfAbsent(m.getPlatform(), k -> new long[3]);
            agg[0] += m.getViews();
            agg[1] += m.getReactions();
            agg[2] += m.getClicks();
        }

        byPlatform.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .findFirst()
                .ifPresent(best -> recommendations.add(String.format(
                        "Лидер по охвату — %s: %d просмотров из %d. Увеличьте долю публикаций на этой площадке.",
                        best.getKey(), best.getValue()[0], totalViews)));

        if (totalViews > 0 && totalClicks > totalReactions) {
            recommendations.add(String.format(
                    "Переходы (%d) превышают реакции (%d) — аудитория кликает по ссылкам. Добавляйте кнопки «Смотреть / Заказать» и в следующие публикации.",
                    totalClicks, totalReactions));
        } else if (totalReactions > totalClicks) {
            recommendations.add(String.format(
                    "Реакции (%d) обгоняют переходы (%d) — усильте призывы к действию (CTA) в текстах и добавьте точные цены из меню бренда.",
                    totalReactions, totalClicks));
        }

        long postsWithMedia = posts.stream()
                .filter(p -> p.getMediaUrl() != null && !p.getMediaUrl().isBlank())
                .count();
        if (postsWithMedia == 0) {
            recommendations.add("В опубликованных постах нет медиа — сгенерируйте визуал в AI Студии и прикрепите к посту перед публикацией.");
        } else if (postsWithMedia < posts.size()) {
            recommendations.add(String.format(
                    "Медиа есть только в %d из %d постов — визуальные публикации собирают больше внимания в лентах.",
                    postsWithMedia, posts.size()));
        }

        if (metricDetails.size() >= 3) {
            AnalyticsDto.PostMetricDetail top = metricDetails.stream()
                    .max((a, b) -> Long.compare((a.getReactions() + a.getClicks()), (b.getReactions() + b.getClicks())))
                    .orElse(null);
            if (top != null && (top.getReactions() + top.getClicks()) > 0) {
                recommendations.add(String.format(
                        "Лучший по вовлечению пост — публикация #%d (%s). Создайте следующую кампанию с похожей формулировкой цели.",
                        top.getPostId(), top.getPlatform()));
            }
        }

        return recommendations;
    }
}
