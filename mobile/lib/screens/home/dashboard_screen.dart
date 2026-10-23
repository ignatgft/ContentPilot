import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/brand_provider.dart';
import '../../providers/campaign_provider.dart';
import '../../providers/channel_provider.dart';
import '../../providers/analytics_provider.dart';
import '../../theme/app_theme.dart';
import '../autopilot/autopilot_dialog.dart';

class DashboardScreen extends ConsumerWidget {
  final Function(int) onTabChange;

  const DashboardScreen({super.key, required this.onTabChange});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final brandState = ref.watch(brandProvider);
    final campaignState = ref.watch(campaignProvider);
    final channelState = ref.watch(channelProvider);
    final analyticsState = ref.watch(analyticsProvider);

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    final userEmail = authState.user?.email ?? 'Пользователь';
    final brandName = brandState.brand?.name ?? 'Бренд не настроен';

    final posts = campaignState.posts;
    final scheduledCount = posts.where((p) => p.status == 'SCHEDULED').length;
    final publishedCount = posts.where((p) => p.status == 'PUBLISHED').length;
    final reviewCount = posts.where((p) => p.status == 'NEEDS_REVIEW').length;

    final nextPost = posts.where((p) => p.status == 'SCHEDULED').isNotEmpty
        ? posts.where((p) => p.status == 'SCHEDULED').first
        : null;

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([
          ref.read(brandProvider.notifier).fetchBrand(),
          ref.read(campaignProvider.notifier).fetchPosts(),
          ref.read(channelProvider.notifier).fetchChannels(),
          ref.read(analyticsProvider.notifier).fetchOverview(),
        ]);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header: Greeting & Active Brand
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    colors.accent,
                    colors.accent.withOpacity(0.8),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: colors.accent.withOpacity(0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Привет, ${userEmail.split('@').first}!',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          brandState.brand?.autonomyMode ?? 'COPILOT',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.storefront_outlined, color: Colors.white70, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          brandName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // If brand not created, show banner
            if (brandState.brand == null) ...[
              Card(
                color: colors.warning.withOpacity(0.1),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: colors.warning.withOpacity(0.4)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Icon(Icons.lightbulb_outline, color: colors.warning, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Настройте профиль бренда',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: colors.ink,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Заполните меню, цены и график для точной генерации контента.',
                              style: TextStyle(
                                color: colors.muted,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () => onTabChange(4), // Go to Brand Tab
                        child: const Text('Заполнить'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Stats Row (Scheduled, Published, Needs Review)
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    context,
                    title: 'В плане',
                    value: '$scheduledCount',
                    icon: Icons.calendar_today_rounded,
                    color: colors.accent,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildMetricCard(
                    context,
                    title: 'Опубликовано',
                    value: '$publishedCount',
                    icon: Icons.check_circle_outline_rounded,
                    color: colors.success,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildMetricCard(
                    context,
                    title: 'Проверка',
                    value: '$reviewCount',
                    icon: Icons.warning_amber_rounded,
                    color: colors.warning,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Main Actions: Autopilot & Create Content
            Row(
              children: [
                Expanded(
                  flex: 6,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: colors.accent,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: const Icon(Icons.auto_awesome_rounded, size: 20),
                    label: const Text(
                      'Автопилот на неделю',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (ctx) => const AutopilotDialog(),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 4,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: const Icon(Icons.add, size: 20),
                    label: const Text(
                      'Создать',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                    ),
                    onPressed: () => onTabChange(2), // Generator Tab
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Next Scheduled Post Card
            Text(
              'Ближайшая публикация',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: colors.ink,
              ),
            ),
            const SizedBox(height: 10),
            if (nextPost != null) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              _buildPlatformBadge(nextPost.platform, colors),
                              const SizedBox(width: 8),
                              Text(
                                nextPost.scheduledAt != null
                                    ? DateFormat('dd MMM, HH:mm', 'ru').format(nextPost.scheduledAt!.toLocal())
                                    : 'Запланировано',
                                style: TextStyle(
                                  color: colors.muted,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                          TextButton(
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            onPressed: () {
                              ref.read(campaignProvider.notifier).publishNow(nextPost.id);
                            },
                            child: const Text('Опубликовать'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        nextPost.text,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: colors.ink,
                          fontSize: 14,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.event_available_outlined, color: colors.muted, size: 36),
                        const SizedBox(height: 8),
                        Text(
                          'Нет запланированных публикаций',
                          style: TextStyle(
                            color: colors.ink,
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Запустите Автопилот, чтобы составить план на неделю.',
                          style: TextStyle(color: colors.muted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),

            // Channels Status Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Площадки и каналы',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: colors.ink,
                  ),
                ),
                TextButton(
                  onPressed: () => onTabChange(3), // Channels Tab
                  child: const Text('Все каналы'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            _buildChannelsRow(channelState, colors),
            const SizedBox(height: 24),

            // Quick Analytics Summary Card
            if (analyticsState.overview != null && analyticsState.overview!.hasData) ...[
              Text(
                'Краткая аналитика',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: colors.ink,
                ),
              ),
              const SizedBox(height: 10),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildMiniStat('Просмотры', '${analyticsState.overview!.totalViews}', colors),
                          _buildMiniStat('Реакции', '${analyticsState.overview!.totalReactions}', colors),
                          _buildMiniStat('Клики', '${analyticsState.overview!.totalClicks}', colors),
                        ],
                      ),
                      if (analyticsState.overview!.summaryMessage.isNotEmpty) ...[
                        const Divider(height: 24),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.insights_rounded, color: Colors.blueAccent, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                analyticsState.overview!.summaryMessage,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: colors.muted,
                                  height: 1.35,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(BuildContext context, {required String title, required String value, required IconData icon, required Color color}) {
    final colors = Theme.of(context).brightness == Brightness.dark ? CpColors.dark : CpColors.light;

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: colors.ink,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: colors.muted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlatformBadge(String platform, CpColors colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: colors.chipBg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        platform.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: colors.chipText,
        ),
      ),
    );
  }

  Widget _buildChannelsRow(ChannelState state, CpColors colors) {
    final platforms = ['TELEGRAM', 'VK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK'];

    return SizedBox(
      height: 72,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: platforms.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final p = platforms[index];
          final isConnected = state.channels.any((c) => c.platform.toUpperCase() == p);
          final isManual = p == 'TIKTOK';

          return Container(
            width: 115,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  p,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: colors.ink,
                  ),
                ),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isConnected
                            ? (isManual ? Colors.amber : colors.success)
                            : colors.muted.withOpacity(0.4),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        isConnected ? (isManual ? 'Ручной' : 'Активен') : 'Не подкл.',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: colors.muted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMiniStat(String label, String value, CpColors colors) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: colors.ink,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: colors.muted,
          ),
        ),
      ],
    );
  }
}
