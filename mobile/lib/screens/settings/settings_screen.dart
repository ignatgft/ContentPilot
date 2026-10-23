import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/campaign_provider.dart';
import '../../theme/app_theme.dart';
import '../../main.dart';

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
    final client = ref.read(apiClientProvider);
    _urlController = TextEditingController(text: client.currentBaseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  void _saveServerUrl() {
    final newUrl = _urlController.text.trim();
    if (newUrl.isNotEmpty) {
      ref.read(apiClientProvider).updateBaseUrl(newUrl);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Адрес бэкенда обновлен: $newUrl')),
      );
    }
  }

  Future<void> _stopAllPosts() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Остановить все публикации?'),
        content: const Text(
          'Все запланированные публикации во всех соцсетях будут переведены в статус «PAUSED». Вы сможете возобновить их позже вручную.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Остановить всё'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final pausedCount = await ref.read(campaignProvider.notifier).stopAll();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Публикации приостановлены: $pausedCount'),
            backgroundColor: Colors.amber.shade900,
          ),
        );
      }
    }
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Выйти из аккаунта?'),
        content: const Text('Сохраненная сессия и токены на устройстве будут удалены.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Выйти'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await ref.read(authProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final themeMode = ref.watch(themeModeProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      children: [
        // User profile header
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: colors.accent,
                  child: const Icon(Icons.person, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        authState.user?.email ?? 'Пользователь',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: colors.ink,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'ID: ${authState.user?.id ?? '—'} • Авторизован',
                        style: TextStyle(fontSize: 12, color: colors.muted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Server Connection Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.dns_outlined, color: colors.accent, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'Подключение к серверу',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: colors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  'Базовый URL бэкенда ContentPilot:',
                  style: TextStyle(fontSize: 12, color: colors.muted),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _urlController,
                  decoration: InputDecoration(
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.check),
                      onPressed: _saveServerUrl,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    TextButton(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: () {
                        _urlController.text = 'http://192.168.10.181:8080/api/v1';
                        _saveServerUrl();
                      },
                      child: const Text('Wi-Fi IP (192.168.10.181)', style: TextStyle(fontSize: 11)),
                    ),
                    const SizedBox(width: 8),
                    TextButton(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      onPressed: () {
                        _urlController.text = 'http://10.0.2.2:8080/api/v1';
                        _saveServerUrl();
                      },
                      child: const Text('Эмулятор (10.0.2.2)', style: TextStyle(fontSize: 11)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Appearance & Theme Card
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.palette_outlined, color: colors.accent, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'Тема оформления',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: colors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SegmentedButton<ThemeMode>(
                  segments: const [
                    ButtonSegment(value: ThemeMode.system, label: Text('Авто')),
                    ButtonSegment(value: ThemeMode.light, label: Text('Светлая')),
                    ButtonSegment(value: ThemeMode.dark, label: Text('Тёмная')),
                  ],
                  selected: {themeMode},
                  onSelectionChanged: (set) {
                    ref.read(themeModeProvider.notifier).state = set.first;
                  },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Emergency Kill Switch Card
        Card(
          color: colors.warning.withOpacity(0.08),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: BorderSide(color: colors.warning.withOpacity(0.4)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.shield_outlined, color: colors.warning, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'Кнопка «Остановить всё»',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: colors.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Мгновенная пауза всех очередей и публикаций во всех социальных сетях при форс-мажоре.',
                  style: TextStyle(fontSize: 12, color: colors.muted),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.red.shade700,
                    minimumSize: const Size.fromHeight(42),
                  ),
                  icon: const Icon(Icons.pause_circle_outline),
                  label: const Text('Остановить все публикации'),
                  onPressed: _stopAllPosts,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Logout Button
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.red,
            side: BorderSide(color: Colors.red.withOpacity(0.4)),
            minimumSize: const Size.fromHeight(44),
          ),
          icon: const Icon(Icons.logout),
          label: const Text('Выйти из аккаунта'),
          onPressed: _logout,
        ),
        const SizedBox(height: 16),

        // Version info
        Center(
          child: Text(
            'ContentPilot v1.0.0+1 • Flutter 3.47 • Android',
            style: TextStyle(fontSize: 11, color: colors.muted),
          ),
        ),
      ],
    );
  }
}
