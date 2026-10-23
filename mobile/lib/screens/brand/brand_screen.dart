import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/brand_models.dart';
import '../../providers/brand_provider.dart';
import '../../theme/app_theme.dart';

class MenuItemData {
  final TextEditingController nameController;
  final TextEditingController priceController;

  MenuItemData({required String name, required num price})
      : nameController = TextEditingController(text: name),
        priceController = TextEditingController(text: price > 0 ? price.toString() : '');

  void dispose() {
    nameController.dispose();
    priceController.dispose();
  }
}

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
  final List<MenuItemData> _menuItems = [];
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
    _toneController = TextEditingController(text: b?.tone ?? '');
    _autonomyMode = b?.autonomyMode ?? 'COPILOT';

    final facts = b?.facts;
    _addressController = TextEditingController(text: facts?['address']?.toString() ?? '');
    _hoursController = TextEditingController(text: facts?['workingHours']?.toString() ?? '');

    final rawMenu = facts?['menu'];
    if (rawMenu is List) {
      for (final item in rawMenu) {
        if (item is Map) {
          _menuItems.add(MenuItemData(
            name: item['name']?.toString() ?? '',
            price: item['price'] is num ? item['price'] : num.tryParse(item['price']?.toString() ?? '0') ?? 0,
          ));
        }
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    _audienceController.dispose();
    _toneController.dispose();
    _addressController.dispose();
    _hoursController.dispose();
    for (final item in _menuItems) {
      item.dispose();
    }
    super.dispose();
  }

  void _addMenuItem() {
    setState(() {
      _menuItems.add(MenuItemData(name: '', price: 0));
    });
  }

  void _removeMenuItem(int index) {
    setState(() {
      _menuItems[index].dispose();
      _menuItems.removeAt(index);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();

    final menuData = _menuItems
        .where((m) => m.nameController.text.trim().isNotEmpty)
        .map((m) => {
              'name': m.nameController.text.trim(),
              'price': num.tryParse(m.priceController.text.trim()) ?? 0,
            })
        .toList();

    final currentBrand = ref.read(brandProvider).brand;
    final brand = BrandModel(
      name: _nameController.text.trim(),
      description: _descController.text.trim(),
      audience: _audienceController.text.trim(),
      tone: _toneController.text.trim(),
      autonomyMode: _autonomyMode,
      facts: {
        'address': _addressController.text.trim(),
        'workingHours': _hoursController.text.trim(),
        'menu': menuData,
      },
      samples: currentBrand?.samples ?? [],
    );

    final ok = await ref.read(brandProvider.notifier).saveBrand(brand);
    if (mounted && ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Профиль бренда успешно сохранен!'),
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
            // Main Brand Fields Card
            CpCard(
              borderRadius: 20,
              padding: const EdgeInsets.all(18),
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
                      hintText: 'Например, Додо Пицца или Студия Красоты',
                    ),
                    validator: (v) => v == null || v.trim().isEmpty ? 'Введите название бренда' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _descController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Описание бизнеса',
                      hintText: 'Кратко о позиционировании, миссии и продуктах...',
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _audienceController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Целевая аудитория',
                      hintText: 'Кто ваши основные клиенты и покупатели...',
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _toneController,
                    decoration: const InputDecoration(
                      labelText: 'Тон общения (Tone of Voice)',
                      hintText: 'Дружелюбный, экспертный, лаконичный',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Facts & Pricing Memory Card
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
                        child: Icon(Icons.fact_check_outlined, color: colors.accent, size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Память фактов и цен (база знаний)',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: colors.ink,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'ИИ сверяет цены и факты в сгенерированных публикациях с этими данными для предотвращения ошибок.',
                    style: TextStyle(fontSize: 12, color: colors.muted, height: 1.35),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _addressController,
                    decoration: const InputDecoration(
                      labelText: 'Адрес локации',
                      hintText: 'Адрес офиса, магазина или онлайн',
                      prefixIcon: Icon(Icons.location_on_outlined),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _hoursController,
                    decoration: const InputDecoration(
                      labelText: 'Часы работы',
                      hintText: 'Например, Пн-Вс: 09:00 - 21:00',
                      prefixIcon: Icon(Icons.access_time),
                    ),
                  ),
                  const SizedBox(height: 18),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Позиции и цены (меню / услуги):',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: colors.ink),
                      ),
                      TextButton.icon(
                        onPressed: _addMenuItem,
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Добавить', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  if (_menuItems.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: colors.chipBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: colors.border.withOpacity(0.5)),
                      ),
                      child: Text(
                        'Позиции не добавлены. Нажмите «Добавить», чтобы зафиксировать наименования и цены.',
                        style: TextStyle(fontSize: 12, color: colors.muted),
                        textAlign: TextAlign.center,
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _menuItems.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, idx) {
                        final item = _menuItems[idx];
                        return Row(
                          children: [
                            Expanded(
                              flex: 3,
                              child: TextFormField(
                                controller: item.nameController,
                                decoration: const InputDecoration(
                                  hintText: 'Наименование',
                                  isDense: true,
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              flex: 2,
                              child: TextFormField(
                                controller: item.priceController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  hintText: 'Цена ₽',
                                  isDense: true,
                                  contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            IconButton(
                              icon: const Icon(Icons.close, size: 18, color: Colors.redAccent),
                              onPressed: () => _removeMenuItem(idx),
                              tooltip: 'Удалить',
                            ),
                          ],
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Autonomy Mode
            CpCard(
              borderRadius: 20,
              padding: const EdgeInsets.all(18),
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
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    title: const Text('Копилот (Copilot)', style: TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: const Text('Публикация требует подтверждения человеком'),
                    value: 'COPILOT',
                    groupValue: _autonomyMode,
                    onChanged: (val) => setState(() => _autonomyMode = val!),
                  ),
                  RadioListTile<String>(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    title: const Text('Автопилот (Autopilot)', style: TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: const Text('Автоматическая публикация постов без ошибок'),
                    value: 'AUTOPILOT',
                    groupValue: _autonomyMode,
                    onChanged: (val) => setState(() => _autonomyMode = val!),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Save Button
            CpGradientButton(
              text: state.isLoading ? 'Сохранение...' : 'Сохранить профиль бренда',
              icon: Icons.save_outlined,
              isLoading: state.isLoading,
              onPressed: state.isLoading ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}
