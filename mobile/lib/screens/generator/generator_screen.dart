import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/post_models.dart';
import '../../providers/campaign_provider.dart';
import '../../theme/app_theme.dart';

class GeneratorScreen extends ConsumerStatefulWidget {
  const GeneratorScreen({super.key});

  @override
  ConsumerState<GeneratorScreen> createState() => _GeneratorScreenState();
}

class _GeneratorScreenState extends ConsumerState<GeneratorScreen> {
  final TextEditingController _promptController =
      TextEditingController(text: 'Продвинуть сезонный латте Тыква-Пряности');
  final Set<String> _selectedPlatforms = {'TELEGRAM', 'VK', 'INSTAGRAM'};

  final List<String> _presetIdeas = [
    'Продвинуть сезонный латте Тыква-Пряности',
    'Пригласить на завтраки со свежими круассанами',
    'Рассказать про спешелти зерно 100% арабика',
    'Анонсировать субботний каппинг',
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
        title: Text('Редактировать (${post.platform})'),
        content: TextField(
          controller: controller,
          maxLines: 8,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
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
          // Prompt & Goal Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.psychology_rounded, color: colors.accent, size: 24),
                      const SizedBox(width: 8),
                      Text(
                        'Генератор контента ИИ',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: colors.ink,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _promptController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Маркетинговая цель или идея',
                      hintText: 'О чем написать...',
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Preset chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _presetIdeas.map((idea) {
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: ActionChip(
                            label: Text(idea, style: const TextStyle(fontSize: 11)),
                            onPressed: () {
                              setState(() {
                                _promptController.text = idea;
                              });
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Platforms selector
                  Text(
                    'Площадки для адаптации:',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: colors.muted,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: ['TELEGRAM', 'VK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK'].map((p) {
                      final isSelected = _selectedPlatforms.contains(p);
                      return FilterChip(
                        selected: isSelected,
                        label: Text(p, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
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
                  const SizedBox(height: 16),

                  // Generate Button
                  FilledButton.icon(
                    icon: campaignState.isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.auto_awesome, size: 18),
                    label: Text(campaignState.isLoading ? 'ИИ генерирует публикации...' : 'Сгенерировать публикации'),
                    onPressed: campaignState.isLoading ? null : _generate,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Generated Posts List
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
                icon: const Icon(Icons.refresh, size: 20),
                onPressed: () => ref.read(campaignProvider.notifier).fetchPosts(),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (posts.isEmpty) ...[
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 40),
                child: Column(
                  children: [
                    Icon(Icons.post_add_rounded, size: 48, color: colors.muted),
                    const SizedBox(height: 12),
                    Text(
                      'Публикаций пока нет',
                      style: TextStyle(color: colors.ink, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Введите цель выше и нажмите «Сгенерировать публикации»',
                      style: TextStyle(color: colors.muted, fontSize: 12),
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
              separatorBuilder: (_, __) => const SizedBox(height: 12),
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

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isNeedsReview ? colors.warning : colors.border,
          width: isNeedsReview ? 1.5 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row: Platform & Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: colors.chipBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        post.platform,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: colors.chipText,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _buildStatusPill(post.status, colors),
                  ],
                ),
                PopupMenuButton<String>(
                  onSelected: (val) {
                    if (val == 'edit') _showEditPostDialog(post);
                    if (val == 'verify') ref.read(campaignProvider.notifier).verifyPost(post.id);
                  },
                  itemBuilder: (ctx) => [
                    const PopupMenuItem(value: 'edit', child: Text('Редактировать')),
                    const PopupMenuItem(value: 'verify', child: Text('Перепроверить факты')),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Post Text
            Text(
              post.text,
              style: TextStyle(
                fontSize: 14,
                color: colors.ink,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),

            // Factcheck Warning Banner if NEEDS_REVIEW
            if (isNeedsReview) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: colors.warning.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: colors.warning.withOpacity(0.4)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: colors.warning, size: 18),
                        const SizedBox(width: 6),
                        Text(
                          'Фактчекинг: обнаружено несовпадение цен',
                          style: TextStyle(
                            color: colors.warning,
                            fontWeight: FontWeight.w700,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'В посте указана цена 250₽, а в меню кофейни — 320₽.',
                      style: TextStyle(color: colors.ink, fontSize: 12),
                    ),
                    const SizedBox(height: 8),
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.warning,
                        minimumSize: const Size.fromHeight(36),
                      ),
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('Исправить цену на 320₽'),
                      onPressed: () {
                        ref.read(campaignProvider.notifier).fixPrice(post, '250', '320');
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Actions row: Date & Publish button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  post.scheduledAt != null
                      ? DateFormat('dd.MM.yyyy HH:mm').format(post.scheduledAt!.toLocal())
                      : 'Без даты',
                  style: TextStyle(fontSize: 12, color: colors.muted),
                ),
                Row(
                  children: [
                    if (isNeedsReview) ...[
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(80, 36),
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                        ),
                        onPressed: () => ref.read(campaignProvider.notifier).approvePost(post.id),
                        child: const Text('Подтвердить'),
                      ),
                      const SizedBox(width: 6),
                    ],
                    FilledButton(
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(110, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        backgroundColor: isNeedsReview ? Colors.grey : colors.accent,
                      ),
                      onPressed: isNeedsReview
                          ? null // Blocked while in review!
                          : () => ref.read(campaignProvider.notifier).publishNow(post.id),
                      child: Text(isPublished ? 'Опубликован' : 'В эфир сейчас'),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusPill(String status, CpColors colors) {
    Color bg = colors.muted.withOpacity(0.15);
    Color text = colors.muted;

    if (status == 'SCHEDULED') {
      bg = colors.chipBg;
      text = colors.chipText;
    } else if (status == 'PUBLISHED') {
      bg = colors.success.withOpacity(0.15);
      text = colors.success;
    } else if (status == 'NEEDS_REVIEW') {
      bg = colors.warning.withOpacity(0.2);
      text = colors.warning;
    } else if (status == 'PAUSED') {
      bg = Colors.amber.withOpacity(0.15);
      text = Colors.amber.shade800;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: text),
      ),
    );
  }
}
