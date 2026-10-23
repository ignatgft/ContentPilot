import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/analytics_provider.dart';
import '../../theme/app_theme.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(analyticsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    final overview = state.overview;

    return RefreshIndicator(
      onRefresh: () => ref.read(analyticsProvider.notifier).fetchOverview(),
      child: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        children: [
          // Header Summary Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [colors.accent, colors.accent2],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Эффективность контента',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Реальные показатели из подключенных каналов и оценка эффекта.',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildWhiteStat('Просмотры', '${overview?.totalViews ?? 0}'),
                    _buildWhiteStat('Реакции', '${overview?.totalReactions ?? 0}'),
                    _buildWhiteStat('Клики', '${overview?.totalClicks ?? 0}'),
                    _buildWhiteStat('Сэкономлено', '~${(overview?.totalPosts ?? 0) * 1.5}ч'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // AI Insights card
          if (overview != null && overview.summaryMessage.isNotEmpty) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.psychology_alt_rounded, color: Colors.blueAccent, size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'Инсайт ИИ-аналитика',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: colors.ink,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      overview.summaryMessage,
                      style: TextStyle(fontSize: 13, color: colors.ink, height: 1.4),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Recommendations
          if (overview != null && overview.recommendations.isNotEmpty) ...[
            Text(
              'Рекомендации по контенту',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: colors.ink,
              ),
            ),
            const SizedBox(height: 10),
            ...overview.recommendations.map((rec) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.lightbulb_outline, color: colors.warning, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            rec,
                            style: TextStyle(fontSize: 13, color: colors.ink, height: 1.35),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),
          ],

          // Top Posts List
          if (overview != null && overview.topPosts.isNotEmpty) ...[
            Text(
              'Эффективность по публикациям',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: colors.ink,
              ),
            ),
            const SizedBox(height: 10),
            ...overview.topPosts.map((post) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: colors.chipBg,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                post.platform,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: colors.chipText,
                                ),
                              ),
                            ),
                            Row(
                              children: [
                                const Icon(Icons.remove_red_eye_outlined, size: 14, color: Colors.blue),
                                const SizedBox(width: 4),
                                Text('${post.views}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                                const SizedBox(width: 10),
                                const Icon(Icons.favorite_border, size: 14, color: Colors.red),
                                const SizedBox(width: 4),
                                Text('${post.reactions}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                                const SizedBox(width: 10),
                                const Icon(Icons.touch_app_outlined, size: 14, color: Colors.green),
                                const SizedBox(width: 4),
                                Text('${post.clicks}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          post.text,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 13, color: colors.ink),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildWhiteStat(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
