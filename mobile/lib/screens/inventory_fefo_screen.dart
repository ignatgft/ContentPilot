import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/canteen_provider.dart';
import '../theme/canteen_theme.dart';

class InventoryFefoScreen extends ConsumerWidget {
  const InventoryFefoScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final batchesAsync = ref.watch(inventoryBatchesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Склад и партии (FEFO)'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(inventoryBatchesProvider),
          ),
        ],
      ),
      body: batchesAsync.when(
        data: (batches) {
          if (batches.isEmpty) {
            return const Center(child: Text('Партии не найдены'));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: batches.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final b = batches[index];
              final isUrgent = b.daysRemaining <= 1;

              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isUrgent
                        ? CanteenColors.amber
                        : (isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
                    width: isUrgent ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: (isUrgent ? CanteenColors.amber : CanteenColors.primary).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        isUrgent ? Icons.warning_amber_rounded : Icons.inventory_2_outlined,
                        color: isUrgent ? CanteenColors.amber : CanteenColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                b.batchNumber,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, fontFamily: 'monospace'),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: (isUrgent ? CanteenColors.amber : CanteenColors.primary).withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  b.daysRemaining <= 0
                                      ? 'Истекает сегодня!'
                                      : 'Осталось ${b.daysRemaining} дн.',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isUrgent ? CanteenColors.amber : CanteenColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Остаток: ${b.remainingQty} ${b.unit} • Поставщик: ${b.supplier}',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                            ),
                          ),
                          Text(
                            'Срок годности: ${b.expiresAt ?? "Не указан"} • Цена: ${b.unitCost.toStringAsFixed(0)} сом/${b.unit}',
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
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Ошибка: $err')),
      ),
    );
  }
}
