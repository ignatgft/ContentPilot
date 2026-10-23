import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/campaign_provider.dart';
import '../../theme/app_theme.dart';

class AutopilotDialog extends ConsumerStatefulWidget {
  const AutopilotDialog({super.key});

  @override
  ConsumerState<AutopilotDialog> createState() => _AutopilotDialogState();
}

class _AutopilotDialogState extends ConsumerState<AutopilotDialog> {
  final List<String> _goals = [
    'Продвинуть сезонный латте Тыква-Пряности',
    'Привлечь фрилансеров на утренние часы',
    'Анонс мастер-класса по каппингу в субботу',
    'Собрать отзывы постоянных гостей',
    'Программа лояльности: 6-й кофе в подарок',
  ];

  late String _selectedGoal;
  final TextEditingController _customGoalController = TextEditingController();
  bool _isCustom = false;

  @override
  void initState() {
    super.initState();
    _selectedGoal = _goals.first;
  }

  @override
  void dispose() {
    _customGoalController.dispose();
    super.dispose();
  }

  Future<void> _launchAutopilot() async {
    final goal = _isCustom ? _customGoalController.text.trim() : _selectedGoal;
    if (goal.isEmpty) return;

    final campaign = await ref.read(campaignProvider.notifier).createCampaign(goal);
    if (mounted && campaign != null) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Сгенерировано постов: ${campaign.posts.length}. Проверьте фактчекинг!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(campaignProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              gradient: CpColors.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Автопилот на неделю',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
          ),
        ],
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ИИ сформирует сбалансированный недельный медиаплан под ключевую бизнес-цель:',
                style: TextStyle(color: colors.muted, fontSize: 13, height: 1.35),
              ),
              const SizedBox(height: 16),
              ..._goals.map((g) {
                final isSelected = !_isCustom && _selectedGoal == g;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () {
                      setState(() {
                        _isCustom = false;
                        _selectedGoal = g;
                      });
                    },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isSelected ? colors.chipBg : colors.surface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isSelected ? colors.accent : colors.border,
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                            color: isSelected ? colors.accent : colors.muted,
                            size: 18,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              g,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                color: colors.ink,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
              InkWell(
                onTap: () => setState(() => _isCustom = true),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _isCustom ? colors.chipBg : colors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _isCustom ? colors.accent : colors.border,
                      width: _isCustom ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _isCustom ? Icons.radio_button_checked : Icons.radio_button_off,
                        color: _isCustom ? colors.accent : colors.muted,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Своя цель или тема...',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: _isCustom ? FontWeight.w700 : FontWeight.w500,
                          color: colors.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (_isCustom) ...[
                const SizedBox(height: 10),
                TextField(
                  controller: _customGoalController,
                  autofocus: true,
                  decoration: const InputDecoration(
                    hintText: 'Например: Запустить комбо-завтраки до 12:00',
                    isDense: true,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: state.isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('Отмена'),
        ),
        FilledButton.icon(
          icon: state.isLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                )
              : const Icon(Icons.bolt_rounded, size: 18),
          label: Text(state.isLoading ? 'Генерация...' : 'Запустить автопилот'),
          onPressed: state.isLoading ? null : _launchAutopilot,
        ),
      ],
    );
  }
}
