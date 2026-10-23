import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/post_models.dart';
import '../../providers/campaign_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_icons.dart';

class GeneratorScreen extends ConsumerStatefulWidget {
  const GeneratorScreen({super.key});

  @override
  ConsumerState<GeneratorScreen> createState() => _GeneratorScreenState();
}

class _GeneratorScreenState extends ConsumerState<GeneratorScreen> {
  final TextEditingController _promptController =
      TextEditingController(text: 'Продвинуть сезонный латте Тыква-Пряности');
  final Set<String> _selectedPlatforms = {'TELEGRAM', 'VK', 'INSTAGRAM'};
  String _selectedTone = 'Дружелюбный';

  final List<String> _presetIdeas = [
    '☕ Сезонный латте Тыква-Пряности',
    '🥐 Завтраки со свежими круассанами',
    '🌱 100% арабика спешелти обжарки',
    '🎉 Анонс субботнего каппинга со скидкой 20%',
    '⭐ Отзыв гостя и секрет нашего бариста',
  ];

  final List<String> _tones = [
    'Дружелюбный',
    'Экспертный',
    'Продающий',
    'С юмором',
  ];

  @override
  void dispose() {
    _promptController.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    final text = _promptController.text.trim();
    if (text.isEmpty) return;
    FocusScope.of(context).unfocus();

    await ref.read(campaignProvider.notifier).createCampaign(text);
  }

  void _showEditPostDialog(PostModel post) {
    final controller = TextEditingController(text: post.text);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            PlatformIcon(post.platform, size: 22),
            const SizedBox(width: 8),
            Text('Редактировать ${post.platform}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
        content: TextField(
          controller: controller,
          maxLines: 8,
          decoration: const InputDecoration(
            hintText: 'Текст публикации...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Отмена'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(campaignProvider.notifier).updatePost(
                    post.id,
                    text: controller.text,
                    platform: post.platform,
                  );
            },
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final campaignState = ref.watch(campaignProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    final posts = campaignState.posts;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Prompt & Goal Card (Pro Max)
          CpCard(
            borderRadius: 22,
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: colors.accent.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: AppIcon(AppIcons.sparkles, size: 20, color: colors.accent),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'ИИ-генератор контента',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: colors.ink,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: colors.chipBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Claude 3.5 Sonnet',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: colors.chipText),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _promptController,
                  maxLines: 3,
                  style: TextStyle(fontSize: 14, color: colors.ink),
                  decoration: InputDecoration(
                    labelText: 'Маркетинговая цель или инфоповод',
                    hintText: 'О чем написать пост...',
                    alignLabelWithHint: true,
                    suffixIcon: _promptController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () => setState(() => _promptController.clear()),
                          )
                        : null,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 12),

                // Presets Horizontal Strip
                Text(
                  'Быстрые идеи:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: colors.muted),
                ),
                const SizedBox(height: 6),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _presetIdeas.map((idea) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ActionChip(
                          backgroundColor: colors.bg,
                          side: BorderSide(color: colors.border),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          label: Text(idea, style: TextStyle(fontSize: 12, color: colors.ink, fontWeight: FontWeight.w600)),
                          onPressed: () {
                            setState(() {
                              _promptController.text = idea.substring(3).trim();
                            });
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 14),

                // Tone of voice selector
                Text(
                  'Тональность публикации:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: colors.muted),
                ),
                const SizedBox(height: 6),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: _tones.map((tone) {
                      final isSelected = _selectedTone == tone;
                      return Padding(
                        padding: const EdgeInsets.only(right: 6),
                        child: ChoiceChip(
                          selected: isSelected,
                          selectedColor: colors.accent.withOpacity(0.18),
                          backgroundColor: colors.bg,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          side: BorderSide(color: isSelected ? colors.accent : colors.border),
                          label: Text(
                            tone,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                              color: isSelected ? colors.accent : colors.muted,
                            ),
                          ),
                          onSelected: (_) => setState(() => _selectedTone = tone),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(height: 14),

                // Platform selection
                Text(
                  'Площадки для адаптации:',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: colors.muted),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: ['TELEGRAM', 'VK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK'].map((p) {
                    final isSelected = _selectedPlatforms.contains(p);
                    return FilterChip(
                      selected: isSelected,
                      selectedColor: colors.accent.withOpacity(0.15),
                      backgroundColor: colors.bg,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      side: BorderSide(color: isSelected ? colors.accent : colors.border),
                      avatar: PlatformIcon(p, size: 16),
                      label: Text(
                        p,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? colors.accent : colors.ink,
                        ),
                      ),
                      onSelected: (val) {
                        setState(() {
                          if (val) {
                            _selectedPlatforms.add(p);
                          } else if (_selectedPlatforms.length > 1) {
                            _selectedPlatforms.remove(p);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 18),

                // Pro Max Generate Button
                CpGradientButton(
                  text: campaignState.isLoading ? 'ИИ генерирует адаптации...' : 'Сгенерировать публикации',
                  icon: Icons.auto_awesome,
                  isLoading: campaignState.isLoading,
                  onPressed: campaignState.isLoading ? null : _generate,
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // Header for Generated Posts
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Сгенерированные публикации (${posts.length})',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: colors.ink,
                ),
              ),
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: colors.surface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: colors.border),
                  ),
                  child: AppIcon(AppIcons.refresh, size: 16, color: colors.muted),
                ),
                onPressed: () => ref.read(campaignProvider.notifier).fetchPosts(),
              ),
            ],
          ),
          const SizedBox(height: 10),

          if (posts.isEmpty) ...[
            CpCard(
              borderRadius: 20,
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
              child: Center(
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colors.chipBg,
                        shape: BoxShape.circle,
                      ),
                      child: AppIcon(AppIcons.sparkles, size: 32, color: colors.accent),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      'Публикаций пока нет',
                      style: TextStyle(color: colors.ink, fontWeight: FontWeight.w800, fontSize: 16),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Укажите цель выше и нажмите «Сгенерировать публикации»',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: colors.muted, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ] else ...[
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: posts.length,
              separatorBuilder: (_, __) => const SizedBox(height: 14),
              itemBuilder: (context, index) {
                final post = posts[index];
                return _buildPostCard(post, colors, ref);
              },
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPostCard(PostModel post, CpColors colors, WidgetRef ref) {
    final isNeedsReview = post.status == 'NEEDS_REVIEW';
    final isPublished = post.status == 'PUBLISHED';

    return CpCard(
      borderRadius: 18,
      border: isNeedsReview ? Border.all(color: colors.warning, width: 1.5) : null,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row: Platform with authentic icon & Status Badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  PlatformIcon(post.platform, size: 24),
                  const SizedBox(width: 8),
                  Text(
                    post.platform.toUpperCase(),
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: colors.ink,
                    ),
                  ),
                  const SizedBox(width: 10),
                  CpStatusBadge(status: post.status),
                ],
              ),
              Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.copy_rounded, size: 18, color: colors.muted),
                    tooltip: 'Скопировать текст',
                    onPressed: () {
                      Clipboard.setData(ClipboardData(text: post.text));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          behavior: SnackBarBehavior.floating,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          content: const Text('Текст скопирован в буфер обмена'),
                        ),
                      );
                    },
                  ),
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert, size: 20, color: colors.muted),
                    onSelected: (val) {
                      if (val == 'edit') _showEditPostDialog(post);
                      if (val == 'verify') ref.read(campaignProvider.notifier).verifyPost(post.id);
                    },
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Редактировать')])),
                      const PopupMenuItem(value: 'verify', child: Row(children: [Icon(Icons.fact_check_outlined, size: 18), SizedBox(width: 8), Text('Перепроверить факты')])),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Post Text with selection enabled
          SelectableText(
            post.text,
            style: TextStyle(
              fontSize: 14,
              color: colors.ink,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),

          // Factcheck Warning Banner if NEEDS_REVIEW
          if (isNeedsReview) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: colors.warning.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: colors.warning.withOpacity(0.4)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.warning_amber_rounded, color: colors.warning, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Фактчекинг: проверка цены',
                        style: TextStyle(
                          color: colors.warning,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Пожалуйста, подтвердите или отредактируйте параметры публикации перед отправкой.',
                    style: TextStyle(color: colors.ink, fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: colors.warning,
                      minimumSize: const Size.fromHeight(38),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Подтвердить публикацию'),
                    onPressed: () {
                      ref.read(campaignProvider.notifier).approvePost(post.id);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Actions row: Date & Publish button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.schedule, size: 14, color: colors.muted),
                  const SizedBox(width: 4),
                  Text(
                    post.scheduledAt != null
                        ? DateFormat('dd.MM.yyyy HH:mm').format(post.scheduledAt!.toLocal())
                        : 'Без даты',
                    style: TextStyle(fontSize: 12, color: colors.muted, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              Row(
                children: [
                  if (isNeedsReview) ...[
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        minimumSize: const Size(80, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => ref.read(campaignProvider.notifier).approvePost(post.id),
                      child: const Text('Одобрить', style: TextStyle(fontSize: 12)),
                    ),
                    const SizedBox(width: 6),
                  ],
                  FilledButton(
                    style: FilledButton.styleFrom(
                      minimumSize: const Size(110, 36),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      backgroundColor: isPublished ? colors.success : colors.accent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () => ref.read(campaignProvider.notifier).publishNow(post.id),
                    child: Text(
                      isPublished ? 'Опубликован' : 'В эфир сейчас',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
