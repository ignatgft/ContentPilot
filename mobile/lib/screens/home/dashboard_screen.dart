import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../providers/brand_provider.dart';
import '../../providers/campaign_provider.dart';
import '../../providers/channel_provider.dart';
import '../../providers/analytics_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_icons.dart';
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
            // Hero Banner: Gradient with AI Badge & Quick Autopilot Launch
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
                      Expanded(
                        child: Text(
                          'Привет, ${userEmail.split('@').first}!',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.3,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.22),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.white.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.bolt, color: Colors.amberAccent, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              brandState.brand?.autonomyMode ?? 'COPILOT',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.storefront, color: Colors.white70, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          brandName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.auto_awesome, color: Colors.white, size: 18),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Text(
                            'AI готов сгенерировать контент-план на 7 дней',
                            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ),
                        GestureDetector(
                          onTap: () {
                            showDialog(
                              context: context,
                              builder: (ctx) => const AutopilotDialog(),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text(
                              'Запуск',
                              style: TextStyle(
                                color: Color(0xFF4F46E5),
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // If brand not created, show banner
            if (brandState.brand == null) ...[
              CpCard(
                color: colors.warning.withOpacity(0.1),
                border: Border.all(color: colors.warning.withOpacity(0.4)),
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
                              fontWeight: FontWeight.w800,
                              color: colors.ink,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Укажите меню, цены и тон бренда для точной генерации контента.',
                            style: TextStyle(
                              color: colors.muted,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.warning,
                        minimumSize: const Size(80, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => onTabChange(4), // Go to Brand Tab
                      child: const Text('Заполнить', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Quick Actions 4-Grid (Pro Max)
            Row(
              children: [
                Expanded(
                  child: _buildQuickActionCard(
                    title: 'Создать',
                    subtitle: 'AI пост',
                    icon: AppIcons.sparkles,
                    color: const Color(0xFF6366F1),
                    onTap: () => onTabChange(2),
                    colors: colors,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildQuickActionCard(
                    title: 'План',
                    subtitle: 'Календарь',
                    icon: AppIcons.calendar,
                    color: const Color(0xFF06B6D4),
                    onTap: () => onTabChange(1),
                    colors: colors,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildQuickActionCard(
                    title: 'Соцсети',
                    subtitle: 'Каналы',
                    icon: AppIcons.share,
                    color: const Color(0xFF10B981),
                    onTap: () => onTabChange(3),
                    colors: colors,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _buildQuickActionCard(
                    title: 'Аналитика',
                    subtitle: 'Охваты',
                    icon: AppIcons.chart,
                    color: const Color(0xFFF59E0B),
                    onTap: () => onTabChange(5),
                    colors: colors,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Metrics Cards Row
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
            const SizedBox(height: 24),

            // Next Scheduled Post Card
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Ближайшая публикация',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: colors.ink,
                  ),
                ),
                if (nextPost != null)
                  TextButton(
                    onPressed: () => onTabChange(1),
                    child: const Text('Все в календаре', style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            if (nextPost != null) ...[
              CpCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            PlatformIcon(nextPost.platform, size: 24),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  nextPost.platform.toUpperCase(),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w800,
                                    fontSize: 13,
                                    color: colors.ink,
                                  ),
                                ),
                                Row(
                                  children: [
                                    Icon(Icons.schedule, size: 12, color: colors.muted),
                                    const SizedBox(width: 4),
                                    Text(
                                      nextPost.scheduledAt != null
                                          ? DateFormat('dd MMMM, HH:mm', 'ru').format(nextPost.scheduledAt!.toLocal())
                                          : 'Запланировано',
                                      style: TextStyle(
                                        color: colors.muted,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                        FilledButton.tonal(
                          style: FilledButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: () {
                            ref.read(campaignProvider.notifier).publishNow(nextPost.id);
                          },
                          child: const Text('Опубликовать', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      nextPost.text,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: colors.ink,
                        fontSize: 14,
                        height: 1.45,
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              CpCard(
                padding: const EdgeInsets.symmetric(vertical: 26, horizontal: 16),
                child: Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: colors.chipBg,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.event_available_outlined, color: colors.accent, size: 28),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Нет запланированных публикаций',
                        style: TextStyle(
                          color: colors.ink,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Запустите Автопилот, чтобы составить контент-план на неделю.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: colors.muted, fontSize: 12),
                      ),
                    ],
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
                  'Площадки и соцсети',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: colors.ink,
                  ),
                ),
                TextButton(
                  onPressed: () => onTabChange(3), // Channels Tab
                  child: const Text('Настроить', style: TextStyle(fontSize: 12)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _buildChannelsRow(channelState, colors),
            const SizedBox(height: 24),

            // Quick Analytics Summary Card
            if (analyticsState.overview != null && analyticsState.overview!.hasData) ...[
              Text(
                'Сводка активности',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: colors.ink,
                ),
              ),
              const SizedBox(height: 10),
              CpCard(
                padding: const EdgeInsets.all(18),
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
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionCard({
    required String title,
    required String subtitle,
    required String icon,
    required Color color,
    required VoidCallback onTap,
    required CpColors colors,
  }) {
    return CpCard(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      borderRadius: 16,
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: AppIcon(icon, size: 20, color: color),
          ),
          const SizedBox(height: 6),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: colors.ink,
            ),
          ),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w500,
              color: colors.muted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(BuildContext context, {required String title, required String value, required IconData icon, required Color color}) {
    final colors = Theme.of(context).brightness == Brightness.dark ? CpColors.dark : CpColors.light;

    return CpCard(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 14),
      borderRadius: 16,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: colors.ink,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: colors.muted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChannelsRow(ChannelState state, CpColors colors) {
    final platforms = ['TELEGRAM', 'VK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK'];

    return SizedBox(
      height: 80,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: platforms.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final p = platforms[index];
          final isConnected = state.channels.any((c) => c.platform.toUpperCase() == p);
          final isManual = p == 'TIKTOK';

          return CpCard(
            borderRadius: 16,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: SizedBox(
              width: 100,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      PlatformIcon(p, size: 22),
                      Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isConnected
                              ? (isManual ? Colors.amber : colors.success)
                              : colors.muted.withOpacity(0.4),
                          boxShadow: isConnected
                              ? [
                                  BoxShadow(
                                    color: (isManual ? Colors.amber : colors.success).withOpacity(0.5),
                                    blurRadius: 4,
                                    spreadRadius: 1,
                                  ),
                                ]
                              : null,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    p,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: colors.ink,
                    ),
                  ),
                  Text(
                    isConnected ? (isManual ? 'Ручной' : 'Активен') : 'Не подкл.',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: isConnected ? colors.success : colors.muted,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
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
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: colors.ink,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: colors.muted,
          ),
        ),
      ],
    );
  }
}
