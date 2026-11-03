import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/canteen_api_client.dart';
import '../providers/canteen_provider.dart';
import '../theme/canteen_theme.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late TextEditingController _urlController;

  @override
  void initState() {
    super.initState();
    _urlController = TextEditingController(text: CanteenApiClient().baseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _saveUrl() async {
    await CanteenApiClient().setBaseUrl(_urlController.text);
    ref.invalidate(schoolProvider);
    ref.invalidate(dishesProvider);
    ref.invalidate(bookingsProvider);
    ref.invalidate(bookingSummaryProvider);
    ref.invalidate(inventoryBatchesProvider);
    ref.invalidate(analyticsProvider);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: CanteenColors.primary,
          content: Text('Сервер сохранен и данные обновлены'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentRole = ref.watch(userRoleProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Настройки'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Role Selection
          Text(
            'РЕЖИМ ДОСТУПА',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),

          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => ref.read(userRoleProvider.notifier).state = 'STUDENT',
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: currentRole == 'STUDENT' ? CanteenColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          'Школьник / Родитель',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: currentRole == 'STUDENT' ? Colors.white : (isDark ? CanteenColors.darkText : CanteenColors.lightText),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => ref.read(userRoleProvider.notifier).state = 'STAFF',
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: currentRole == 'STAFF' ? CanteenColors.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          'Сотрудник столовой',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: currentRole == 'STAFF' ? Colors.white : (isDark ? CanteenColors.darkText : CanteenColors.lightText),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Backend Server URL
          Text(
            'ПОДКЛЮЧЕНИЕ К БЭКЕНДУ СТОЛОВОЙ',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),

          TextField(
            controller: _urlController,
            decoration: InputDecoration(
              labelText: 'Адрес API SmartCanteen',
              hintText: 'http://192.168.10.181:8080/api/v1/canteen',
              filled: true,
              fillColor: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              suffixIcon: IconButton(
                icon: const Icon(Icons.save, color: CanteenColors.primary),
                onPressed: _saveUrl,
              ),
            ),
          ),

          const SizedBox(height: 8),
          Text(
            'Приложение автоматически переключается на встроенные демо-данные Школы №24 при отсутствии связи с сетью.',
            style: TextStyle(fontSize: 11, color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted),
          ),

          const SizedBox(height: 24),

          // About Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SmartCanteen AI Mobile',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  'Версия 2.0.0 • Кейс «Умная столовая»\nШкола-гимназия №24 г. Бишкек',
                  style: TextStyle(fontSize: 12, color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
