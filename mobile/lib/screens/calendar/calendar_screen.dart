import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/post_models.dart';
import '../../providers/campaign_provider.dart';
import '../../theme/app_theme.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  String _selectedFilter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final campaignState = ref.watch(campaignProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    List<PostModel> posts = campaignState.posts;
    if (_selectedFilter == 'SCHEDULED') {
      posts = posts.where((p) => p.status == 'SCHEDULED').toList();
    } else if (_selectedFilter == 'NEEDS_REVIEW') {
      posts = posts.where((p) => p.status == 'NEEDS_REVIEW').toList();
    } else if (_selectedFilter == 'PUBLISHED') {
      posts = posts.where((p) => p.status == 'PUBLISHED').toList();
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(campaignProvider.notifier).fetchPosts(),
      child: Column(
        children: [
          // Filter Tabs
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildFilterChip('ALL', 'Все (${campaignState.posts.length})', colors),
                  const SizedBox(width: 8),
                  _buildFilterChip('SCHEDULED', 'В плане', colors),
                  const SizedBox(width: 8),
                  _buildFilterChip('NEEDS_REVIEW', 'На проверке', colors),
                  const SizedBox(width: 8),
                  _buildFilterChip('PUBLISHED', 'Опубликовано', colors),
                ],
              ),
            ),
          ),
          const Divider(height: 1),

          // Posts List
          Expanded(
            child: posts.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.calendar_month_outlined, size: 48, color: colors.muted),
                        const SizedBox(height: 12),
                        Text(
                          'Публикаций в этой категории нет',
                          style: TextStyle(
                            color: colors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: posts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final post = posts[index];
                      final isNeedsReview = post.status == 'NEEDS_REVIEW';
                      final isPublished = post.status == 'PUBLISHED';

                      return Card(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(
                            color: isNeedsReview ? colors.warning : colors.border,
                            width: isNeedsReview ? 1.5 : 1,
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
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
                                      Text(
                                        post.scheduledAt != null
                                            ? DateFormat('dd MMM, HH:mm', 'ru').format(post.scheduledAt!.toLocal())
                                            : 'Без времени',
                                        style: TextStyle(fontSize: 12, color: colors.muted, fontWeight: FontWeight.w600),
                                      ),
                                    ],
                                  ),
                                  _buildStatusBadge(post.status, colors),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(
                                post.text,
                                style: TextStyle(fontSize: 13, color: colors.ink, height: 1.4),
                              ),
                              if (isNeedsReview) ...[
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: colors.warning.withOpacity(0.12),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(Icons.warning_amber_rounded, size: 16, color: colors.warning),
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'Несовпадение цены (в посте 250₽, в меню 320₽)',
                                          style: TextStyle(fontSize: 11, color: colors.warning, fontWeight: FontWeight.w600),
                                        ),
                                      ),
                                      TextButton(
                                        style: TextButton.styleFrom(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          minimumSize: Size.zero,
                                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        ),
                                        onPressed: () {
                                          ref.read(campaignProvider.notifier).fixPrice(post, '250', '320');
                                        },
                                        child: const Text('Исправить на 320₽', style: TextStyle(fontSize: 11)),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  if (isNeedsReview) ...[
                                    OutlinedButton(
                                      style: OutlinedButton.styleFrom(
                                        minimumSize: const Size(80, 32),
                                        padding: const EdgeInsets.symmetric(horizontal: 8),
                                      ),
                                      onPressed: () => ref.read(campaignProvider.notifier).approvePost(post.id),
                                      child: const Text('Утвердить', style: TextStyle(fontSize: 12)),
                                    ),
                                    const SizedBox(width: 8),
                                  ],
                                  FilledButton(
                                    style: FilledButton.styleFrom(
                                      minimumSize: const Size(100, 32),
                                      padding: const EdgeInsets.symmetric(horizontal: 8),
                                      backgroundColor: isNeedsReview ? Colors.grey : colors.accent,
                                    ),
                                    onPressed: isNeedsReview
                                        ? null
                                        : () => ref.read(campaignProvider.notifier).publishNow(post.id),
                                    child: Text(isPublished ? 'Опубликован' : 'В эфир', style: const TextStyle(fontSize: 12)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String value, String label, CpColors colors) {
    final isSelected = _selectedFilter == value;
    return ChoiceChip(
      selected: isSelected,
      label: Text(label, style: TextStyle(fontSize: 12, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500)),
      onSelected: (_) => setState(() => _selectedFilter = value),
    );
  }

  Widget _buildStatusBadge(String status, CpColors colors) {
    Color bg = colors.muted.withOpacity(0.12);
    Color fg = colors.muted;

    if (status == 'SCHEDULED') {
      bg = colors.chipBg;
      fg = colors.chipText;
    } else if (status == 'PUBLISHED') {
      bg = colors.success.withOpacity(0.15);
      fg = colors.success;
    } else if (status == 'NEEDS_REVIEW') {
      bg = colors.warning.withOpacity(0.2);
      fg = colors.warning;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: fg)),
    );
  }
}
