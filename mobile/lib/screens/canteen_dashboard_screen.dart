import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/canteen_provider.dart';
import '../theme/canteen_theme.dart';

class CanteenDashboardScreen extends ConsumerWidget {
  const CanteenDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolAsync = ref.watch(schoolProvider);
    final analyticsAsync = ref.watch(analyticsProvider);
    final summaryAsync = ref.watch(bookingSummaryProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            schoolAsync.when(
              data: (s) => Text(s.name, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
              loading: () => const Text('SmartCanteen AI', style: TextStyle(fontSize: 15)),
              error: (_, __) => const Text('Школа №24 г. Бишкек', style: TextStyle(fontSize: 15)),
            ),
            const Text(
              'Умная школьная столовая • FEFO • СанПиН',
              style: TextStyle(fontSize: 11, color: CanteenColors.primaryLight, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(analyticsProvider);
          ref.invalidate(bookingSummaryProvider);
          ref.invalidate(schoolProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Hero Status Banner (Apple × JetBrains Indigo-Graphite)
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF202A3C), Color(0xFF30294A)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFF303744)),
                boxShadow: [
                  BoxShadow(
                    color: CanteenColors.primary.withValues(alpha: 0.18),
                    blurRadius: 18,
                    offset: const Offset(0, 6),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: CanteenColors.primary.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: CanteenColors.primary.withValues(alpha: 0.3)),
                        ),
                        child: const Text(
                          'СЕГОДНЯ: 2 СМЕНЫ ПИТАНИЯ',
                          style: TextStyle(color: CanteenColors.primaryLight, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.5),
                        ),
                      ),
                      const Icon(Icons.verified, color: CanteenColors.primaryLight, size: 20),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Цифровой баланс питания',
                    style: TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Приготовлено = Выдано + Остаток + Отходы (0% расхождений)',
                    style: TextStyle(color: Color(0xFFA6AFBC), fontSize: 12),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Metrics Grid
            analyticsAsync.when(
              data: (data) => Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: _metricCard(
                          'Приготовлено порций',
                          '${data.totalPreparedPortions}',
                          'План на сегодня',
                          Icons.restaurant_menu,
                          CanteenColors.primary,
                          isDark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _metricCard(
                          'Выдано ученикам',
                          '${data.totalServedPortions}',
                          '${data.servedRatePortions.toStringAsFixed(1)}% выдачи',
                          Icons.how_to_reg,
                          Colors.blue,
                          isDark,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _metricCard(
                          'Уровень отходов',
                          '${data.wasteRatePortions.toStringAsFixed(1)}%',
                          'Норма СанПиН < 2.0%',
                          Icons.eco,
                          CanteenColors.primaryLight,
                          isDark,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _metricCard(
                          'FEFO-контроль партий',
                          '${data.expiringBatchesCount}',
                          'Партии < 2 дней',
                          Icons.access_time_filled,
                          data.expiringBatchesCount > 0 ? CanteenColors.amber : CanteenColors.primary,
                          isDark,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              loading: () => const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator())),
              error: (_, __) => const SizedBox(),
            ),

            const SizedBox(height: 20),

            // Pre-order Live Tracker
            Text(
              'ПРЕДЗАКАЗ ПИТАНИЯ (БУКИНГ)',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),

            summaryAsync.when(
              data: (sum) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: CanteenColors.primary.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.confirmation_number, color: CanteenColors.primary),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Забронировано: ${sum.totalBooked} горячих обедов',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          Text(
                            'Ожидают на раздаче: ${sum.pendingPickup} порций (${sum.totalRevenueKgs.toStringAsFixed(0)} сом)',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              loading: () => const SizedBox(),
              error: (_, __) => const SizedBox(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _metricCard(String title, String value, String subtitle, IconData icon, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
          const SizedBox(height: 2),
          Text(subtitle, style: TextStyle(fontSize: 10, color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted)),
        ],
      ),
    );
  }
}
