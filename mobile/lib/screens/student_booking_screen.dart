import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/canteen_models.dart';
import '../providers/canteen_provider.dart';
import '../theme/canteen_theme.dart';

class StudentBookingScreen extends ConsumerStatefulWidget {
  const StudentBookingScreen({super.key});

  @override
  ConsumerState<StudentBookingScreen> createState() => _StudentBookingScreenState();
}

class _StudentBookingScreenState extends ConsumerState<StudentBookingScreen> {
  final _nameController = TextEditingController(text: 'Азамат Ибраимов');
  final _gradeController = TextEditingController(text: '7-Б');
  final String _selectedDate = DateTime.now().toIso8601String().split('T')[0];
  String _dietaryNotes = 'Без ограничений';
  int? _selectedDishId;
  MealBookingModel? _createdTicket;
  bool _isSubmitting = false;

  final List<Map<String, String>> _presets = [
    {'name': 'Азамат Ибраимов', 'grade': '7-Б'},
    {'name': 'Айгерим Садыкова', 'grade': '9-А'},
    {'name': 'Дастан Оморов', 'grade': '4-В'},
    {'name': 'Камила Жумабекова', 'grade': '11-Б'},
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _gradeController.dispose();
    super.dispose();
  }

  void _submitBooking() async {
    if (_nameController.text.trim().isEmpty || _gradeController.text.trim().isEmpty) return;

    setState(() => _isSubmitting = true);
    try {
      final ticket = await ref.read(bookingsProvider.notifier).createBooking(
        studentName: _nameController.text.trim(),
        grade: _gradeController.text.trim(),
        bookingDate: _selectedDate,
        dishId: _selectedDishId,
        dietaryNotes: _dietaryNotes,
      );

      if (mounted) {
        setState(() {
          _createdTicket = ticket;
          _isSubmitting = false;
        });
        HapticFeedback.mediumImpact();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: CanteenColors.primary,
            content: Text('Талон успешно оформлен! Код: ${ticket.code}'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: CanteenColors.red,
            content: Text('Ошибка при оформлении: $e'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dishesAsync = ref.watch(dishesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Предзаказ питания'),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: CanteenColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              '75 сом / обед',
              style: TextStyle(
                color: CanteenColors.primaryLight,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // If ticket was just created, show ticket card prominently
            if (_createdTicket != null) ...[
              _buildTicketCard(_createdTicket!, isDark),
              const SizedBox(height: 20),
            ],

            // Quick Student Presets
            Text(
              'БЫСТРЫЙ ВЫБОР УЧЕНИКА',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _presets.map((p) {
                final isSelected = _nameController.text == p['name'];
                return ChoiceChip(
                  label: Text('${p['name']} (${p['grade']})'),
                  selected: isSelected,
                  onSelected: (val) {
                    if (val) {
                      setState(() {
                        _nameController.text = p['name']!;
                        _gradeController.text = p['grade']!;
                      });
                    }
                  },
                  selectedColor: CanteenColors.primary.withValues(alpha: 0.2),
                  labelStyle: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    color: isSelected
                        ? (isDark ? CanteenColors.primaryLight : CanteenColors.primaryDark)
                        : (isDark ? CanteenColors.darkText : CanteenColors.lightText),
                  ),
                );
              }).toList(),
            ),

            const SizedBox(height: 16),

            // Form inputs
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: TextField(
                    controller: _nameController,
                    decoration: InputDecoration(
                      labelText: 'ФИО Ученика',
                      filled: true,
                      fillColor: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _gradeController,
                    decoration: InputDecoration(
                      labelText: 'Класс',
                      filled: true,
                      fillColor: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Date & Dietary
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Дата питания', style: TextStyle(fontSize: 10, color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted)),
                        const SizedBox(height: 4),
                        Text(_selectedDate, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _dietaryNotes,
                    decoration: InputDecoration(
                      labelText: 'Диета',
                      filled: true,
                      fillColor: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'Без ограничений', child: Text('Стандарт')),
                      DropdownMenuItem(value: 'Халяль', child: Text('Халяль')),
                      DropdownMenuItem(value: 'Без лактозы', child: Text('Без лактозы')),
                      DropdownMenuItem(value: 'Без глютена', child: Text('Без глютена')),
                      DropdownMenuItem(value: 'Вегетарианское', child: Text('Вегетарианское')),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _dietaryNotes = val);
                    },
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Dish Selector
            Text(
              'ВЫБОР БЛЮДА ИЗ МЕНЮ ДНЯ',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),

            dishesAsync.when(
              data: (dishes) {
                if (_selectedDishId == null && dishes.isNotEmpty) {
                  _selectedDishId = dishes.first.id;
                }
                return Column(
                  children: dishes.map((dish) {
                    final isSelected = _selectedDishId == dish.id;
                    return GestureDetector(
                      onTap: () => setState(() => _selectedDishId = dish.id),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? CanteenColors.primary.withValues(alpha: 0.12)
                              : (isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: isSelected
                                ? CanteenColors.primary
                                : (isDark ? CanteenColors.darkBorder : CanteenColors.lightBorder),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                              color: isSelected ? CanteenColors.primary : Colors.grey,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    dish.name,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: isDark ? CanteenColors.darkText : CanteenColors.lightText,
                                    ),
                                  ),
                                  Text(
                                    dish.category,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? CanteenColors.darkTextMuted : CanteenColors.lightTextMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (_, __) => const SizedBox(),
            ),

            const SizedBox(height: 16),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitBooking,
                icon: const Icon(Icons.confirmation_number_outlined),
                label: Text(
                  _isSubmitting ? 'Оформление...' : 'Забронировать горячий обед (75 сом)',
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: CanteenColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 2,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTicketCard(MealBookingModel ticket, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? CanteenColors.darkSurface : CanteenColors.lightSurface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: CanteenColors.primary.withValues(alpha: 0.5), width: 2),
        boxShadow: [
          BoxShadow(
            color: CanteenColors.primary.withValues(alpha: 0.1),
            blurRadius: 16,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.qr_code, color: CanteenColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'ЭЛЕКТРОННЫЙ ТАЛОН',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      letterSpacing: 0.5,
                      color: CanteenColors.primary,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: CanteenColors.primary.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  ticket.status,
                  style: const TextStyle(
                    color: CanteenColors.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: QrImageView(
              data: ticket.code,
              version: QrVersions.auto,
              size: 150.0,
              eyeStyle: const QrEyeStyle(
                eyeShape: QrEyeShape.square,
                color: CanteenColors.primary,
              ),
              dataModuleStyle: const QrDataModuleStyle(
                dataModuleShape: QrDataModuleShape.square,
                color: CanteenColors.primary,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
            decoration: BoxDecoration(
              color: isDark ? CanteenColors.darkBg : CanteenColors.lightBg,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                const Text('Код для получения на раздаче:', style: TextStyle(fontSize: 11, color: Colors.grey)),
                const SizedBox(height: 4),
                Text(
                  ticket.code,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    color: CanteenColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Ученик: ${ticket.studentName} (${ticket.grade})', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              Text('${ticket.price.toStringAsFixed(0)} сом', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900)),
            ],
          ),
        ],
      ),
    );
  }
}
