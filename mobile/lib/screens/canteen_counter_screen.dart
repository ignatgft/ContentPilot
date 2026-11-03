import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/canteen_provider.dart';
import '../theme/canteen_theme.dart';

class CanteenCounterScreen extends ConsumerStatefulWidget {
  const CanteenCounterScreen({super.key});

  @override
  ConsumerState<CanteenCounterScreen> createState() => _CanteenCounterScreenState();
}

class _CanteenCounterScreenState extends ConsumerState<CanteenCounterScreen> {
  final _codeController = TextEditingController();
  bool _isServing = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _serveCode(String code) async {
    if (code.trim().isEmpty) return;

    setState(() => _isServing = true);
    try {
      final served = await ref.read(bookingsProvider.notifier).serveBookingByCode(code.trim().toUpperCase());
      _codeController.clear();
      HapticFeedback.heavyImpact();

      if (mounted) {
        setState(() => _isServing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: CanteenColors.primary,
            content: Text('Порция выдана: ${served.studentName} (${served.grade})'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isServing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: CanteenColors.red,
            content: Text('Ошибка: $e'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(bookingsProvider);
    final summaryAsync = ref.watch(bookingSummaryProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Терминал раздачи'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(bookingsProvider.notifier).loadBookings();
              ref.invalidate(bookingSummaryProvider);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Quick stats
          summaryAsync.when(
            data: (sum) => Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _statItem('Всего', '${sum.totalBooked}', CanteenColors.primary, isDark),
                  _statItem('Выдано', '${sum.totalServed}', Colors.blue, isDark),
                  _statItem('Ожидает', '${sum.pendingPickup}', CanteenColors.amber, isDark),
                ],
              ),
            ),
            loading: () => const SizedBox(height: 48),
            error: (_, __) => const SizedBox(),
          ),

          // Code input bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _codeController,
                    textCapitalization: TextCapitalization.characters,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'monospace', letterSpacing: 1.5),
                    decoration: InputDecoration(
                      hintText: 'Код талона (SC-XXXX)',
                      prefixIcon: const Icon(Icons.qr_code_scanner, color: CanteenColors.primary),
                      filled: true,
                      fillColor: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onSubmitted: (val) => _serveCode(val),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _isServing ? null : () => _serveCode(_codeController.text),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: CanteenColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isServing
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Выдать', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),

          // Bookings list
          Expanded(
            child: bookingsAsync.when(
              data: (list) {
                if (list.isEmpty) {
                  return const Center(child: Text('Нет активных талонов'));
                }
                return ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final item = list[index];
                    final isServed = item.status == 'SERVED';

                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isServed
                              ? Colors.transparent
                              : (isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isServed ? Colors.grey.withValues(alpha: 0.2) : CanteenColors.primary.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              item.code,
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                                color: isServed ? Colors.grey : CanteenColors.primary,
                                fontSize: 13,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.studentName,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? CanteenColors.darkText : CanteenColors.lightText,
                                  ),
                                ),
                                Text(
                                  '${item.grade} • ${item.dishName}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (isServed)
                            const Icon(Icons.check_circle, color: CanteenColors.primary, size: 24)
                          else
                            TextButton.icon(
                              onPressed: () => _serveCode(item.code),
                              icon: const Icon(Icons.check, size: 16),
                              label: const Text('Выдать'),
                              style: TextButton.styleFrom(
                                foregroundColor: CanteenColors.primary,
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text('Ошибка: $err')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statItem(String label, String value, Color color, bool isDark) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color)),
        Text(label, style: TextStyle(fontSize: 11, color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted)),
      ],
    );
  }
}
