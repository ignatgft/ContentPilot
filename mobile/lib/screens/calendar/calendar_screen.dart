import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../models/post_models.dart';
import '../../providers/campaign_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/app_icons.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  String _selectedFilter = 'ALL';
  DateTime _selectedDate = DateTime.now();

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

    final now = DateTime.now();
    final weekStart = now.subtract(Duration(days: now.weekday - 1));
    final weekDays = List.generate(7, (i) => weekStart.add(Duration(days: i)));

    return RefreshIndicator(
      onRefresh: () => ref.read(campaignProvider.notifier).fetchPosts(),
      child: Column(
        children: [
          // Weekly Timeline Strip (Pro Max)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
            color: colors.surface,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: weekDays.map((day) {
                final isToday = day.day == now.day && day.month == now.month && day.year == now.year;
                final isSelected = day.day == _selectedDate.day && day.month == _selectedDate.month && day.year == _selectedDate.year;
                final dayPosts = campaignState.posts.where((p) =>
                    p.scheduledAt != null &&
                    p.scheduledAt!.day == day.day &&
                    p.scheduledAt!.month == day.month).length;

                return GestureDetector(
                  onTap: () {
                    setState(() => _selectedDate = day);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: isSelected ? CpColors.primaryGradient : null,
                      color: isSelected
                          ? null
                          : (isToday ? colors.chipBg : Colors.transparent),
                      borderRadius: BorderRadius.circular(14),
                      border: isToday && !isSelected
                          ? Border.all(color: colors.accent.withOpacity(0.5))
                          : null,
                    ),
                    child: Column(
                      children: [
                        Text(
                          DateFormat('E', 'ru').format(day).toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: isSelected
                                ? Colors.white
                                : (isToday ? colors.accent : colors.muted),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${day.day}',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: isSelected
                                ? Colors.white
                                : (isToday ? colors.accent : colors.ink),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          width: 5,
                          height: 5,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: dayPosts > 0
                                ? (isSelected ? Colors.white : colors.accent)
                                : Colors.transparent,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const Divider(height: 1),

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

          // Posts List
          Expanded(
            child: posts.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: colors.chipBg,
                            shape: BoxShape.circle,
                          ),
                          child: AppIcon(AppIcons.calendar, size: 36, color: colors.accent),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Публикаций в этой категории нет',
                          style: TextStyle(
                            color: colors.ink,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Создайте контент в генераторе или запустите автопилот',
                          style: TextStyle(color: colors.muted, fontSize: 12),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: posts.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final post = posts[index];
                      final isNeedsReview = post.status == 'NEEDS_REVIEW';
                      final isPublished = post.status == 'PUBLISHED';

                      return CpCard(
                        borderRadius: 18,
                        border: isNeedsReview ? Border.all(color: colors.warning, width: 1.5) : null,
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    PlatformIcon(post.platform, size: 24),
                                    const SizedBox(width: 10),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          post.platform.toUpperCase(),
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w800,
                                            color: colors.ink,
                                          ),
                                        ),
                                        Row(
                                          children: [
                                            Icon(Icons.schedule, size: 12, color: colors.muted),
                                            const SizedBox(width: 4),
                                            Text(
                                              post.scheduledAt != null
                                                  ? DateFormat('dd MMM, HH:mm', 'ru').format(post.scheduledAt!.toLocal())
                                                  : 'Без времени',
                                              style: TextStyle(fontSize: 11, color: colors.muted, fontWeight: FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                CpStatusBadge(status: post.status),
                              ],
                            ),
                            const SizedBox(height: 12),
                            SelectableText(
                              post.text,
                              style: TextStyle(fontSize: 14, color: colors.ink, height: 1.45),
                            ),
                            if (isNeedsReview) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: colors.warning.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: colors.warning.withOpacity(0.4)),
                                ),
                                child: Row(
                                  children: [
                                    Icon(Icons.warning_amber_rounded, size: 18, color: colors.warning),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Требует подтверждения публикации',
                                        style: TextStyle(fontSize: 12, color: colors.warning, fontWeight: FontWeight.w700),
                                      ),
                                    ),
                                    FilledButton(
                                      style: FilledButton.styleFrom(
                                        backgroundColor: colors.warning,
                                        minimumSize: const Size(80, 32),
                                        padding: const EdgeInsets.symmetric(horizontal: 10),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      onPressed: () {
                                        ref.read(campaignProvider.notifier).approvePost(post.id);
                                      },
                                      child: const Text('Одобрить', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 14),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                IconButton(
                                  icon: Icon(Icons.copy_rounded, size: 18, color: colors.muted),
                                  tooltip: 'Скопировать',
                                  onPressed: () {
                                    Clipboard.setData(ClipboardData(text: post.text));
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        behavior: SnackBarBehavior.floating,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        content: const Text('Текст скопирован'),
                                      ),
                                    );
                                  },
                                ),
                                Row(
                                  children: [
                                    if (isNeedsReview) ...[
                                      OutlinedButton(
                                        style: OutlinedButton.styleFrom(
                                          minimumSize: const Size(80, 34),
                                          padding: const EdgeInsets.symmetric(horizontal: 10),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                        onPressed: () => ref.read(campaignProvider.notifier).approvePost(post.id),
                                        child: const Text('Утвердить', style: TextStyle(fontSize: 12)),
                                      ),
                                      const SizedBox(width: 8),
                                    ],
                                    FilledButton(
                                      style: FilledButton.styleFrom(
                                        minimumSize: const Size(100, 34),
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        backgroundColor: isPublished ? colors.success : colors.accent,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      onPressed: () => ref.read(campaignProvider.notifier).publishNow(post.id),
                                      child: Text(
                                        isPublished ? 'Опубликован' : 'В эфир',
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
      selectedColor: colors.accent.withOpacity(0.15),
      backgroundColor: colors.surface,
      side: BorderSide(color: isSelected ? colors.accent : colors.border),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      label: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
          color: isSelected ? colors.accent : colors.ink,
        ),
      ),
      onSelected: (_) => setState(() => _selectedFilter = value),
    );
  }
}
