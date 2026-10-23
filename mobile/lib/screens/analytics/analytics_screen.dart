import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/analytics_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_icons.dart';

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
          // Pro Max Header Summary Card
          CpCard(
            gradient: CpColors.primaryGradient,
            borderRadius: 22,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Эффективность контента',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.2,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Live Данные',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Метрики охвата и вовлечённости из подключённых соцсетей.',
                  style: TextStyle(color: Colors.white70, fontSize: 13),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildWhiteStat('Просмотры', '${overview?.totalViews ?? 0}', Icons.visibility_outlined),
                    _buildWhiteStat('Реакции', '${overview?.totalReactions ?? 0}', Icons.favorite_border),
                    _buildWhiteStat('Клики', '${overview?.totalClicks ?? 0}', Icons.touch_app_outlined),
                    _buildWhiteStat('Сэкономлено', '~${((overview?.totalPosts ?? 0) * 1.5).toStringAsFixed(1)}ч', Icons.timer_outlined),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // AI Insights card (Pro Max)
          if (overview != null && overview.summaryMessage.isNotEmpty) ...[
            CpCard(
              borderRadius: 20,
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1).withOpacity(0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.psychology_alt_rounded, color: Color(0xFF6366F1), size: 22),
                      ),
                      const SizedBox(width: 10),
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
                  const SizedBox(height: 12),
                  Text(
                    overview.summaryMessage,
                    style: TextStyle(fontSize: 13, color: colors.ink, height: 1.45),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
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
                padding: const EdgeInsets.only(bottom: 10),
                child: CpCard(
                  borderRadius: 16,
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: colors.warning.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.lightbulb_outline, color: colors.warning, size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          rec,
                          style: TextStyle(fontSize: 13, color: colors.ink, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 18),
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
                padding: const EdgeInsets.only(bottom: 12),
                child: CpCard(
                  borderRadius: 18,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              PlatformIcon(post.platform, size: 22),
                              const SizedBox(width: 8),
                              Text(
                                post.platform.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: colors.ink,
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              const Icon(Icons.remove_red_eye_outlined, size: 14, color: Colors.blue),
                              const SizedBox(width: 4),
                              Text('${post.views}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                              const SizedBox(width: 12),
                              const Icon(Icons.favorite_border, size: 14, color: Colors.red),
                              const SizedBox(width: 4),
                              Text('${post.reactions}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                              const SizedBox(width: 12),
                              const Icon(Icons.touch_app_outlined, size: 14, color: Colors.green),
                              const SizedBox(width: 4),
                              Text('${post.clicks}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        post.text,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13, color: colors.ink, height: 1.35),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildWhiteStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white70, size: 18),
        const SizedBox(height: 4),
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
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
