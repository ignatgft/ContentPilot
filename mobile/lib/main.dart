import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'providers/auth_provider.dart';
import 'providers/brand_provider.dart';
import 'providers/campaign_provider.dart';
import 'theme/app_theme.dart';
import 'theme/app_icons.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/home/dashboard_screen.dart';
import 'screens/calendar/calendar_screen.dart';
import 'screens/generator/generator_screen.dart';
import 'screens/channels/channels_screen.dart';
import 'screens/brand/brand_screen.dart';
import 'screens/analytics/analytics_screen.dart';
import 'screens/settings/settings_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: ContentPilotApp()));
}

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);

class ContentPilotApp extends ConsumerWidget {
  const ContentPilotApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final authState = ref.watch(authProvider);

    return MaterialApp(
      title: 'ContentPilot 2.0',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(CpColors.light, Brightness.light),
      darkTheme: buildTheme(CpColors.dark, Brightness.dark),
      themeMode: themeMode,
      home: authState.isLoading
          ? const Scaffold(
              body: Center(
                child: CircularProgressIndicator(),
              ),
            )
          : authState.isAuthenticated
              ? const MobileMainScaffold()
              : const AuthScreen(),
    );
  }
}

class MobileMainScaffold extends ConsumerStatefulWidget {
  const MobileMainScaffold({super.key});

  @override
  ConsumerState<MobileMainScaffold> createState() => _MobileMainScaffoldState();
}

class _MobileMainScaffoldState extends ConsumerState<MobileMainScaffold> {
  int _currentIndex = 0;

  void _onTabSelect(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;
    final brand = ref.watch(brandProvider).brand;
    final campaignState = ref.watch(campaignProvider);
    final reviewCount = campaignState.posts.where((p) => p.status == 'NEEDS_REVIEW').length;

    final titles = [
      'ContentPilot',
      'Календарь публикаций',
      'Генератор контента',
      'Каналы и соцсети',
      'Профиль бренда',
      'Аналитика',
      'Настройки',
    ];

    final screens = [
      DashboardScreen(onTabChange: _onTabSelect),
      const CalendarScreen(),
      const GeneratorScreen(),
      const ChannelsScreen(),
      const BrandScreen(),
      const AnalyticsScreen(),
      const SettingsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: CpColors.primaryGradient,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: colors.accent.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.rocket_launch, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    _currentIndex < titles.length ? titles[_currentIndex] : 'ContentPilot',
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (brand != null)
                    Text(
                      '${brand.name} • ${brand.autonomyMode}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: colors.accent,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
              size: 22,
            ),
            tooltip: 'Переключить тему',
            onPressed: () {
              ref.read(themeModeProvider.notifier).state =
                  isDark ? ThemeMode.light : ThemeMode.dark;
            },
          ),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.shield_outlined, color: Colors.red, size: 18),
            ),
            tooltip: 'Экстренная остановка (Stop All)',
            onPressed: () async {
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
                    'Все запланированные публикации во всех соцсетях будут поставлены на паузу (статус PAUSED).',
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
              if (confirmed == true && context.mounted) {
                final count = await ref.read(campaignProvider.notifier).stopAll();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      content: Text('Приостановлено публикаций: $count'),
                    ),
                  );
                }
              }
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: Drawer(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  DrawerHeader(
                    decoration: const BoxDecoration(
                      gradient: CpColors.primaryGradient,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.rocket_launch, color: Colors.white, size: 28),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'PRO MAX',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 10,
                                  letterSpacing: 1,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          'ContentPilot 2.0',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18),
                        ),
                        Text(
                          brand?.name ?? 'Бренд не настроен',
                          style: const TextStyle(color: Colors.white70, fontSize: 13),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  ListTile(
                    leading: const AppIcon(AppIcons.home, size: 22),
                    title: const Text('Главная', style: TextStyle(fontWeight: FontWeight.w600)),
                    selected: _currentIndex == 0,
                    selectedColor: colors.accent,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 0);
                    },
                  ),
                  ListTile(
                    leading: const AppIcon(AppIcons.calendar, size: 22),
                    title: const Text('Календарь', style: TextStyle(fontWeight: FontWeight.w600)),
                    trailing: reviewCount > 0
                        ? Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: colors.warning,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$reviewCount',
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                            ),
                          )
                        : null,
                    selected: _currentIndex == 1,
                    selectedColor: colors.accent,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 1);
                    },
                  ),
                  ListTile(
                    leading: const AppIcon(AppIcons.sparkles, size: 22),
                    title: const Text('Генератор контента', style: TextStyle(fontWeight: FontWeight.w600)),
                    selected: _currentIndex == 2,
                    selectedColor: colors.accent,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 2);
                    },
                  ),
                  ListTile(
                    leading: const AppIcon(AppIcons.share, size: 22),
                    title: const Text('Каналы и соцсети', style: TextStyle(fontWeight: FontWeight.w600)),
                    selected: _currentIndex == 3,
                    selectedColor: colors.accent,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 3);
                    },
                  ),
                  ListTile(
                    leading: const AppIcon(AppIcons.store, size: 22),
                    title: const Text('Профиль бренда', style: TextStyle(fontWeight: FontWeight.w600)),
                    selected: _currentIndex == 4,
                    selectedColor: colors.accent,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 4);
                    },
                  ),
                  const Divider(indent: 16, endIndent: 16),
                  ListTile(
                    leading: const AppIcon(AppIcons.chart, size: 22),
                    title: const Text('Аналитика', style: TextStyle(fontWeight: FontWeight.w600)),
                    selected: _currentIndex == 5,
                    selectedColor: colors.accent,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 5);
                    },
                  ),
                  ListTile(
                    leading: const AppIcon(AppIcons.settings, size: 22),
                    title: const Text('Настройки', style: TextStyle(fontWeight: FontWeight.w600)),
                    selected: _currentIndex == 6,
                    selectedColor: colors.accent,
                    onTap: () {
                      Navigator.pop(context);
                      setState(() => _currentIndex = 6);
                    },
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            ListTile(
              leading: const AppIcon(AppIcons.logout, size: 22, color: Colors.red),
              title: const Text('Выйти', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w700)),
              onTap: () async {
                Navigator.pop(context);
                await ref.read(authProvider.notifier).logout();
              },
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: 16, top: 4),
              child: Text(
                'ContentPilot v2.0 • Pro Max Edition',
                style: TextStyle(color: colors.muted, fontSize: 11),
              ),
            ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex < 5 ? _currentIndex : 0,
        onDestinationSelected: (idx) {
          setState(() => _currentIndex = idx);
        },
        destinations: [
          const NavigationDestination(
            icon: AppIcon(AppIcons.home, size: 22),
            label: 'Главная',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: reviewCount > 0,
              label: Text('$reviewCount'),
              backgroundColor: colors.warning,
              child: const AppIcon(AppIcons.calendar, size: 22),
            ),
            label: 'Календарь',
          ),
          const NavigationDestination(
            icon: AppIcon(AppIcons.sparkles, size: 22),
            label: 'Создать',
          ),
          const NavigationDestination(
            icon: AppIcon(AppIcons.share, size: 22),
            label: 'Каналы',
          ),
          const NavigationDestination(
            icon: AppIcon(AppIcons.store, size: 22),
            label: 'Бренд',
          ),
        ],
      ),
    );
  }
}
