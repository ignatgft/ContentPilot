import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/brand_models.dart';
import '../../providers/brand_provider.dart';
import '../../theme/app_theme.dart';

class BrandScreen extends ConsumerStatefulWidget {
  const BrandScreen({super.key});

  @override
  ConsumerState<BrandScreen> createState() => _BrandScreenState();
}

class _BrandScreenState extends ConsumerState<BrandScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameController;
  late TextEditingController _descController;
  late TextEditingController _audienceController;
  late TextEditingController _toneController;
  late TextEditingController _addressController;
  late TextEditingController _hoursController;
  String _autonomyMode = 'COPILOT';

  @override
  void initState() {
    super.initState();
    final currentBrand = ref.read(brandProvider).brand;
    _initControllers(currentBrand);
  }

  void _initControllers(BrandModel? b) {
    _nameController = TextEditingController(text: b?.name ?? '');
    _descController = TextEditingController(text: b?.description ?? '');
    _audienceController = TextEditingController(text: b?.audience ?? '');
    _toneController = TextEditingController(text: b?.tone ?? 'Дружелюбный, экспертный, тёплый');
    _autonomyMode = b?.autonomyMode ?? 'COPILOT';

    final facts = b?.facts;
    _addressController = TextEditingController(text: facts?['address']?.toString() ?? 'ул. Ленина, д. 42');
    _hoursController = TextEditingController(text: facts?['workingHours']?.toString() ?? '08:00 - 22:00');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _audienceController.dispose();
    _toneController.dispose();
    _addressController.dispose();
    _hoursController.dispose();
    super.dispose();
  }

  void _loadDemoPreset() {
    final demo = ref.read(brandProvider.notifier).getDemoPreset();
    setState(() {
      _nameController.text = demo.name;
      _descController.text = demo.description ?? '';
      _audienceController.text = demo.audience ?? '';
      _toneController.text = demo.tone ?? '';
      _autonomyMode = demo.autonomyMode;

      final facts = demo.facts;
      _addressController.text = facts?['address']?.toString() ?? '';
      _hoursController.text = facts?['workingHours']?.toString() ?? '';
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Данные кофейни для демо подставлены. Нажмите «Сохранить»!')),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    final brand = BrandModel(
      name: _nameController.text.trim(),
      description: _descController.text.trim(),
      audience: _audienceController.text.trim(),
      tone: _toneController.text.trim(),
      autonomyMode: _autonomyMode,
      facts: {
        'address': _addressController.text.trim(),
        'workingHours': _hoursController.text.trim(),
        'menu': [
          {'name': 'Сезонный латте Тыква-Пряности', 'price': 320},
          {'name': 'Капучино', 'price': 250},
          {'name': 'Флэт уайт', 'price': 280},
          {'name': 'Круассан с миндалем', 'price': 190},
        ],
      },
      samples: [
        'Утро начинается не с кофе, а с выбора: нежный латте или бодрящий фильтр? Ждём вас на Ленина, 42! ☕️✨',
        'Наш новый тыквенно-пряный латте уже согревает гостей! Спешите попробовать осенний хит всего за 320₽ 🍂🎃',
      ],
    );

    final ok = await ref.read(brandProvider.notifier).saveBrand(brand);
    if (mounted && ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Профиль бренда успешно сохранен в базе данных!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(brandProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Quick Demo 3-min Fill button
            Card(
              color: colors.chipBg,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.flash_on, color: Colors.amber, size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'Демо-сценарий (3 минуты)',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: colors.chipText,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Заполняет проверенные данные кофейни «Зёрна и Истории»: меню, цены, адрес и часы работы.',
                      style: TextStyle(fontSize: 12, color: colors.muted),
                    ),
                    const SizedBox(height: 10),
                    FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: colors.accent,
                        minimumSize: const Size.fromHeight(38),
                      ),
                      icon: const Icon(Icons.coffee, size: 18),
                      label: const Text('Заполнить кофейню для демо (3 мин)'),
                      onPressed: _loadDemoPreset,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Main Brand Fields Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Основные сведения о бизнесе',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: colors.ink,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Название бренда *',
                        hintText: 'Кофейня "Зёрна и Истории"',
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Введите название бренда' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Описание бизнеса',
                        hintText: 'Уютная спешелти кофейня в центре города...',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _audienceController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Целевая аудитория',
                        hintText: 'Студенты, фрилансеры, любители спешелти кофе...',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _toneController,
                      decoration: const InputDecoration(
                        labelText: 'Тон общения (Tone of Voice)',
                        hintText: 'Дружелюбный, тёплый, экспертный',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Facts & Pricing Memory Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.fact_check_outlined, color: colors.accent, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Память фактов и цен (для фактчекинга)',
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
                      'ИИ строго сверяет цены и факты в сгенерированных постах с этими данными.',
                      style: TextStyle(fontSize: 12, color: colors.muted),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _addressController,
                      decoration: const InputDecoration(
                        labelText: 'Адрес',
                        hintText: 'ул. Ленина, д. 42',
                        prefixIcon: Icon(Icons.location_on_outlined),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _hoursController,
                      decoration: const InputDecoration(
                        labelText: 'Часы работы',
                        hintText: '08:00 - 22:00',
                        prefixIcon: Icon(Icons.access_time),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colors.chipBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Фиксированное меню и цены:',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: colors.chipText),
                          ),
                          const SizedBox(height: 6),
                          const Text('• Сезонный латте Тыква-Пряности: 320₽'),
                          const Text('• Капучино: 250₽'),
                          const Text('• Флэт уайт: 280₽'),
                          const Text('• Круассан с миндалем: 190₽'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Autonomy Mode
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Режим автономности публикации',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: colors.ink,
                      ),
                    ),
                    const SizedBox(height: 10),
                    RadioListTile<String>(
                      title: const Text('Копилот (Copilot)', style: TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: const Text('Публикация требует подтверждения пользователем'),
                      value: 'COPILOT',
                      groupValue: _autonomyMode,
                      onChanged: (val) => setState(() => _autonomyMode = val!),
                    ),
                    RadioListTile<String>(
                      title: const Text('Автопилот (Autopilot)', style: TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: const Text('Автоматическая публикация постов без ошибок'),
                      value: 'AUTOPILOT',
                      groupValue: _autonomyMode,
                      onChanged: (val) => setState(() => _autonomyMode = val!),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Save Button
            FilledButton.icon(
              icon: state.isLoading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.save_outlined),
              label: Text(state.isLoading ? 'Сохранение...' : 'Сохранить профиль бренда'),
              onPressed: state.isLoading ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}
