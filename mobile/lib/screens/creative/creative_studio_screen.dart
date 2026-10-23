import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/creative_models.dart';
import '../../providers/creative_provider.dart';
import '../../theme/app_icons.dart';
import '../../theme/app_theme.dart';

class CreativeStudioScreen extends ConsumerStatefulWidget {
  const CreativeStudioScreen({super.key});

  @override
  ConsumerState<CreativeStudioScreen> createState() => _CreativeStudioScreenState();
}

class _CreativeStudioScreenState extends ConsumerState<CreativeStudioScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _promptController = TextEditingController(
    text: 'Чашка капучино с нежным латте-артом на деревянном столике у окна кофейни',
  );
  final TextEditingController _brandController = TextEditingController(text: 'COFFEE PILOT');
  final TextEditingController _priceController = TextEditingController(text: '320 ₽');
  final TextEditingController _badgeController = TextEditingController(text: 'Сезонная новинка');
  final TextEditingController _ctaController = TextEditingController(text: 'Попробовать');

  String _selectedStyle = 'COFFEE_AESTHETIC';
  String _selectedAspectRatio = '1:1';
  int _durationSeconds = 5;
  String _cameraMotion = 'SLOW_ZOOM_IN';
  bool _enableOverlay = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _promptController.dispose();
    _brandController.dispose();
    _priceController.dispose();
    _badgeController.dispose();
    _ctaController.dispose();
    super.dispose();
  }

  void _applyPreset(CreativePresetModel preset) {
    setState(() {
      _promptController.text = preset.prompt;
      _selectedStyle = preset.style;
      _selectedAspectRatio = preset.defaultAspectRatio;
      _badgeController.text = preset.suggestedBadge;
      _ctaController.text = preset.suggestedCta;
    });
  }

  Future<void> _handleGenerateImage() async {
    FocusScope.of(context).unfocus();
    final notifier = ref.read(creativeProvider.notifier);
    await notifier.generateImage(
      prompt: _promptController.text.trim(),
      style: _selectedStyle,
      aspectRatio: _selectedAspectRatio,
      enableOverlay: _enableOverlay,
      brandName: _brandController.text.trim(),
      price: _priceController.text.trim(),
      badgeText: _badgeController.text.trim(),
      ctaText: _ctaController.text.trim(),
    );
  }

  Future<void> _handleGenerateVideo() async {
    FocusScope.of(context).unfocus();
    final notifier = ref.read(creativeProvider.notifier);
    await notifier.createVideo(
      prompt: _promptController.text.trim(),
      style: _selectedStyle,
      aspectRatio: _selectedAspectRatio,
      durationSeconds: _durationSeconds,
      cameraMotion: _cameraMotion,
      enableOverlay: _enableOverlay,
      brandName: _brandController.text.trim(),
      price: _priceController.text.trim(),
      badgeText: _badgeController.text.trim(),
    );
  }

  void _showAttachSheet(MediaAssetModel media) {
    final captionController = TextEditingController(
      text: '🔥 ${media.prompt}\n\nСпециальное предложение от ${_brandController.text}!',
    );
    String targetPlatform = 'TELEGRAM';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          final colors = isDark ? CpColors.dark : CpColors.light;
          return Container(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border.all(color: colors.border),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: colors.muted.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Прикрепить к публикации',
                  style: TextStyle(color: colors.ink, fontWeight: FontWeight.w800, fontSize: 18),
                ),
                const SizedBox(height: 16),
                Text('Платформа:', style: TextStyle(color: colors.muted, fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Row(
                  children: ['TELEGRAM', 'VK', 'INSTAGRAM'].map((p) {
                    final isSelected = targetPlatform == p;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(p, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: isSelected ? Colors.white : colors.ink)),
                        selected: isSelected,
                        selectedColor: colors.accent,
                        backgroundColor: colors.surfaceVariant,
                        onSelected: (val) {
                          if (val) setSheetState(() => targetPlatform = p);
                        },
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                Text('Текст поста:', style: TextStyle(color: colors.muted, fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                TextField(
                  controller: captionController,
                  maxLines: 3,
                  style: TextStyle(color: colors.ink, fontSize: 13),
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: colors.surfaceVariant,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.border)),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: colors.accent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: () async {
                      Navigator.pop(ctx);
                      final success = await ref.read(creativeProvider.notifier).attachToPost(
                        mediaId: media.id,
                        platform: targetPlatform,
                        postText: captionController.text.trim(),
                      );
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            behavior: SnackBarBehavior.floating,
                            content: Text(success ? '✅ Публикация создана с этим медиафайлом!' : 'Ошибка создания публикации'),
                          ),
                        );
                      }
                    },
                    child: const Text('Создать публикацию', style: TextStyle(fontWeight: FontWeight.w800)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;
    final state = ref.watch(creativeProvider);

    return Scaffold(
      backgroundColor: colors.bg,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: colors.accent.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.auto_awesome, color: colors.accent, size: 20),
            ),
            const SizedBox(width: 10),
            const Text('AI Creative Studio', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 19)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: colors.accent,
          indicatorWeight: 3,
          labelColor: colors.accent,
          unselectedLabelColor: colors.muted,
          labelStyle: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
          tabs: [
            const Tab(icon: Icon(Icons.photo_camera_back, size: 18), text: 'Фото & Баннеры'),
            const Tab(icon: Icon(Icons.video_collection, size: 18), text: 'Reels & Видео'),
            Tab(icon: const Icon(Icons.folder_copy, size: 18), text: 'Медиатека (${state.mediaList.length})'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildGeneratorTab(isImage: true),
          _buildGeneratorTab(isImage: false),
          _buildLibraryTab(),
        ],
      ),
    );
  }

  Widget _buildGeneratorTab({required bool isImage}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;
    final state = ref.watch(creativeProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Presets Carousel
          if (state.presets.isNotEmpty) ...[
            Text(
              'БЫСТРЫЕ ПРЕСЕТЫ ДЛЯ БИЗНЕСА',
              style: TextStyle(color: colors.muted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 40,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: state.presets.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, idx) {
                  final p = state.presets[idx];
                  return ActionChip(
                    backgroundColor: colors.surface,
                    side: BorderSide(color: colors.border),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    label: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(p.title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: colors.ink)),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                          decoration: BoxDecoration(
                            color: colors.accent.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            p.defaultAspectRatio,
                            style: TextStyle(color: colors.accent, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                    onPressed: () => _applyPreset(p),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Prompt Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Описание рекламного визуала',
                  style: TextStyle(color: colors.ink, fontWeight: FontWeight.w800, fontSize: 14),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _promptController,
                  maxLines: 3,
                  style: TextStyle(color: colors.ink, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Опишите продукт, композицию и настроение...',
                    filled: true,
                    fillColor: colors.surfaceVariant,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: colors.border)),
                  ),
                ),
                const SizedBox(height: 14),

                // Style Selection
                Text('Стиль визуала:', style: TextStyle(color: colors.muted, fontSize: 11, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    {'key': 'COFFEE_AESTHETIC', 'label': '☕ Кофе & Уют'},
                    {'key': 'STUDIO_COMMERCIAL', 'label': '📸 Студия'},
                    {'key': 'DARK_LUXURY', 'label': '✨ Тёмный люкс'},
                    {'key': 'VIBRANT_POP', 'label': '🎨 Яркий поп'},
                  ].map((s) {
                    final isSel = _selectedStyle == s['key'];
                    return ChoiceChip(
                      label: Text(s['label']!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isSel ? Colors.white : colors.ink)),
                      selected: isSel,
                      selectedColor: colors.accent,
                      backgroundColor: colors.surfaceVariant,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      onSelected: (val) {
                        if (val) setState(() => _selectedStyle = s['key']!);
                      },
                    );
                  }).toList(),
                ),

                const SizedBox(height: 14),

                // Aspect Ratio Selection
                Text('Формат кадра:', style: TextStyle(color: colors.muted, fontSize: 11, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    {'key': '1:1', 'label': '1:1 Квадрат'},
                    {'key': '9:16', 'label': '9:16 Reels'},
                    {'key': '16:9', 'label': '16:9 Баннер'},
                  ].map((f) {
                    final isSel = _selectedAspectRatio == f['key'];
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: ChoiceChip(
                          label: Center(
                            child: Text(
                              f['label']!,
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: isSel ? Colors.white : colors.ink),
                            ),
                          ),
                          selected: isSel,
                          selectedColor: colors.accent,
                          backgroundColor: colors.surfaceVariant,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          onSelected: (val) {
                            if (val) setState(() => _selectedAspectRatio = f['key']!);
                          },
                        ),
                      ),
                    );
                  }).toList(),
                ),

                if (!isImage) ...[
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Длительность ролика:', style: TextStyle(color: colors.muted, fontSize: 11, fontWeight: FontWeight.w700)),
                      Text('$_durationSeconds сек', style: TextStyle(color: colors.accent, fontWeight: FontWeight.w800, fontSize: 12)),
                    ],
                  ),
                  Slider(
                    value: _durationSeconds.toDouble(),
                    min: 3,
                    max: 12,
                    divisions: 9,
                    activeColor: colors.accent,
                    onChanged: (val) => setState(() => _durationSeconds = val.round()),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Deterministic Overlay Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.layers_outlined, color: colors.accent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Фирменный оверлей', style: TextStyle(color: colors.ink, fontWeight: FontWeight.w800, fontSize: 13)),
                          Text('Детерминированный слой (без галлюцинаций цен)', style: TextStyle(color: colors.muted, fontSize: 11)),
                        ],
                      ),
                    ),
                    Switch(
                      value: _enableOverlay,
                      activeColor: colors.accent,
                      onChanged: (val) => setState(() => _enableOverlay = val),
                    ),
                  ],
                ),
                if (_enableOverlay) ...[
                  const Divider(height: 24),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _brandController,
                          decoration: InputDecoration(
                            labelText: 'Бренд',
                            labelStyle: TextStyle(fontSize: 11, color: colors.muted),
                            filled: true,
                            fillColor: colors.surfaceVariant,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: colors.border)),
                          ),
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: colors.ink),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _priceController,
                          decoration: InputDecoration(
                            labelText: 'Цена из меню',
                            labelStyle: TextStyle(fontSize: 11, color: colors.accent),
                            filled: true,
                            fillColor: colors.surfaceVariant,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: colors.border)),
                          ),
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: colors.accent),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _badgeController,
                          decoration: InputDecoration(
                            labelText: 'Стикер / Бейдж',
                            labelStyle: TextStyle(fontSize: 11, color: colors.muted),
                            filled: true,
                            fillColor: colors.surfaceVariant,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: colors.border)),
                          ),
                          style: TextStyle(fontSize: 12, color: colors.ink),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _ctaController,
                          decoration: InputDecoration(
                            labelText: 'Кнопка (CTA)',
                            labelStyle: TextStyle(fontSize: 11, color: colors.muted),
                            filled: true,
                            fillColor: colors.surfaceVariant,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: colors.border)),
                          ),
                          style: TextStyle(fontSize: 12, color: colors.ink),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Main Action Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: colors.accent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 4,
              ),
              onPressed: state.isGenerating ? null : (isImage ? _handleGenerateImage : _handleGenerateVideo),
              child: state.isGenerating
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
                        const SizedBox(width: 12),
                        Text(
                          isImage ? 'Генерация изображения...' : 'Рендеринг видеоролика...',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                      ],
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.auto_awesome, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          isImage ? 'Сгенерировать рекламный визуал' : 'Создать промо-ролик Reels',
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                        ),
                      ],
                    ),
            ),
          ),

          // Active Preview Card
          if (state.latestMedia != null) ...[
            const SizedBox(height: 24),
            Text(
              'ПОСЛЕДНИЙ ГОТОВЫЙ РЕЗУЛЬТАТ',
              style: TextStyle(color: colors.muted, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.8),
            ),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: colors.border),
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                children: [
                  AspectRatio(
                    aspectRatio: state.latestMedia!.aspectRatio == '9:16' ? 9 / 16 : (state.latestMedia!.aspectRatio == '16:9' ? 16 / 9 : 1),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.network(
                          state.latestMedia!.url,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: colors.surfaceVariant,
                            child: const Center(child: Icon(Icons.broken_image)),
                          ),
                        ),
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.7),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              state.latestMedia!.aspectRatio,
                              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            state.latestMedia!.prompt,
                            style: TextStyle(color: colors.ink, fontSize: 12, fontWeight: FontWeight.w600),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 8),
                        FilledButton.icon(
                          style: FilledButton.styleFrom(
                            backgroundColor: colors.accent,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () => _showAttachSheet(state.latestMedia!),
                          icon: const Icon(Icons.send, size: 14),
                          label: const Text('В пост', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLibraryTab() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;
    final state = ref.watch(creativeProvider);

    if (state.mediaList.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.folder_open, size: 48, color: colors.muted),
              const SizedBox(height: 12),
              Text('Медиатека пуста', style: TextStyle(color: colors.ink, fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 6),
              Text(
                'Созданные вами рекламные визуалы и ролики будут сохраняться здесь',
                textAlign: TextAlign.center,
                style: TextStyle(color: colors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(creativeProvider.notifier).loadMedia(),
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 0.78,
        ),
        itemCount: state.mediaList.length,
        itemBuilder: (context, idx) {
          final item = state.mediaList[idx];
          return Container(
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: colors.border),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.network(
                        item.thumbnailUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: colors.surfaceVariant,
                          child: const Icon(Icons.broken_image),
                        ),
                      ),
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.65),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            item.aspectRatio,
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                      if (item.mediaType == 'VIDEO')
                        const Center(
                          child: Icon(Icons.play_circle_fill, color: Colors.white, size: 36),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.prompt,
                        style: TextStyle(color: colors.ink, fontSize: 11, fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 6),
                      SizedBox(
                        width: double.infinity,
                        height: 28,
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            padding: EdgeInsets.zero,
                            side: BorderSide(color: colors.accent),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => _showAttachSheet(item),
                          child: Text('В публикацию', style: TextStyle(color: colors.accent, fontSize: 10, fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
