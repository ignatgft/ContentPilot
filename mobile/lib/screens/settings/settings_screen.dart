import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/campaign_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_icons.dart';
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
        SnackBar(
          behavior: SnackBarBehavior.floating,
          content: Text('Адрес бэкенда обновлен: $newUrl'),
        ),
      );
    }
  }

  Future<void> _stopAllPosts() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.red),
            SizedBox(width: 8),
            Text('Остановить всё?'),
          ],
        ),
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
            behavior: SnackBarBehavior.floating,
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
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
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
        // User profile header (Pro Max)
        CpCard(
          borderRadius: 20,
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: CpColors.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                ),
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
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFF10B981),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'ID: ${authState.user?.id ?? '—'} • Сессия активна',
                          style: TextStyle(fontSize: 12, color: colors.muted, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Server Connection Card (Pro Max)
        CpCard(
          borderRadius: 20,
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: colors.accent.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.dns_outlined, color: colors.accent, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Подключение к серверу API',
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
              const SizedBox(height: 10),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  ActionChip(
                    label: const Text('Cloudflare Tunnel', style: TextStyle(fontSize: 11)),
                    onPressed: () {
                      _urlController.text = 'https://allows-thread-dedicated-screening.trycloudflare.com/api/v1';
                      _saveServerUrl();
                    },
                  ),
                  ActionChip(
                    label: const Text('Wi-Fi IP (192.168.10.181)', style: TextStyle(fontSize: 11)),
                    onPressed: () {
                      _urlController.text = 'http://192.168.10.181:8080/api/v1';
                      _saveServerUrl();
                    },
                  ),
                  ActionChip(
                    label: const Text('Эмулятор (10.0.2.2)', style: TextStyle(fontSize: 11)),
                    onPressed: () {
                      _urlController.text = 'http://10.0.2.2:8080/api/v1';
                      _saveServerUrl();
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Appearance & Theme Card
        CpCard(
          borderRadius: 20,
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: colors.accent.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(Icons.palette_outlined, color: colors.accent, size: 20),
                  ),
                  const SizedBox(width: 10),
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
              const SizedBox(height: 12),
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
        const SizedBox(height: 16),

        // Emergency Kill Switch Card
        CpCard(
          color: colors.warning.withOpacity(0.08),
          border: Border.all(color: colors.warning.withOpacity(0.4)),
          borderRadius: 20,
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.shield_outlined, color: Colors.red, size: 20),
                  ),
                  const SizedBox(width: 10),
                  Text(
                    'Экстренная остановка (Stop All)',
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
                'Мгновенная пауза всех очередей и публикаций во всех социальных сетях при форс-мажоре.',
                style: TextStyle(fontSize: 12, color: colors.muted, height: 1.35),
              ),
              const SizedBox(height: 14),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.red.shade700,
                  minimumSize: const Size.fromHeight(44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.pause_circle_outline),
                label: const Text('Остановить все публикации', style: TextStyle(fontWeight: FontWeight.w700)),
                onPressed: _stopAllPosts,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Logout Button
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.red,
            side: BorderSide(color: Colors.red.withOpacity(0.4)),
            minimumSize: const Size.fromHeight(48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          icon: const Icon(Icons.logout),
          label: const Text('Выйти из аккаунта', style: TextStyle(fontWeight: FontWeight.w700)),
          onPressed: _logout,
        ),
        const SizedBox(height: 16),

        // Version info
        Center(
          child: Text(
            'ContentPilot v2.0 • Pro Max Edition',
            style: TextStyle(fontSize: 11, color: colors.muted, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}
