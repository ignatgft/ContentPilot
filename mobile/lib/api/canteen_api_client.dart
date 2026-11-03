import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/canteen_models.dart';

class CanteenApiClient {
  static final CanteenApiClient _instance = CanteenApiClient._internal();
  factory CanteenApiClient() => _instance;

  final Dio _dio = Dio();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Default server address for local LAN testing
  String _baseUrl = 'http://192.168.10.181:8080/api/v1/canteen';

  CanteenApiClient._internal() {
    _dio.options.connectTimeout = const Duration(seconds: 4);
    _dio.options.receiveTimeout = const Duration(seconds: 4);
    _loadSavedUrl();
  }

  Future<void> _loadSavedUrl() async {
    try {
      final saved = await _storage.read(key: 'canteen_server_url');
      if (saved != null && saved.isNotEmpty) {
        _baseUrl = saved;
      }
    } catch (_) {}
  }

  Future<void> setBaseUrl(String url) async {
    _baseUrl = url.trim();
    await _storage.write(key: 'canteen_server_url', value: _baseUrl);
  }

  String get baseUrl => _baseUrl;

  // --- 1. School Info ---
  Future<SchoolModel> fetchSchool() async {
    try {
      final res = await _dio.get('$_baseUrl/school');
      if (res.statusCode == 200) {
        return SchoolModel.fromJson(res.data);
      }
    } catch (_) {}
    return SchoolModel(
      id: 1,
      name: 'Школа-гимназия №24 им. А. Токомбаева (DEMO)',
      address: 'г. Бишкек, ул. Тыныстанова, 110',
      currency: 'KGS',
      timezone: 'Asia/Bishkek',
      totalStudents: 650,
    );
  }

  // --- 2. Dishes ---
  Future<List<DishModel>> fetchDishes() async {
    try {
      final res = await _dio.get('$_baseUrl/dishes');
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((i) => DishModel.fromJson(i)).toList();
      }
    } catch (_) {}
    return [
      DishModel(id: 1, name: 'Плов школьный с говядиной', category: 'Горячие блюда', description: 'Рис лазер, говядина, желтая морковь', price: 75.0),
      DishModel(id: 2, name: 'Суп куриный с лапшой', category: 'Первые блюда', description: 'Куриное филе, домашняя лапша, зелень', price: 60.0),
      DishModel(id: 3, name: 'Каша гречневая с котлетой', category: 'Горячие блюда', description: 'Котлета из говядины, рассыпчатая гречка', price: 70.0),
      DishModel(id: 4, name: 'Салат витаминный', category: 'Салаты', description: 'Свежая капуста, морковь, растительное масло', price: 35.0),
      DishModel(id: 5, name: 'Компот из сухофруктов', category: 'Напитки', description: 'Яблоки, курага, изюм, сахар', price: 20.0),
    ];
  }

  // --- 3. Bookings ---
  Future<List<MealBookingModel>> fetchBookings({String? date, String? grade, String? status}) async {
    try {
      final qParams = <String, dynamic>{};
      if (date != null) qParams['date'] = date;
      if (grade != null && grade != 'ALL') qParams['grade'] = grade;
      if (status != null && status != 'ALL') qParams['status'] = status;

      final res = await _dio.get('$_baseUrl/bookings', queryParameters: qParams);
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((i) => MealBookingModel.fromJson(i)).toList();
      }
    } catch (_) {}
    return _demoBookings;
  }

  Future<MealBookingModel> createBooking({
    required String studentName,
    required String grade,
    required String bookingDate,
    int? dishId,
    String? dietaryNotes,
  }) async {
    try {
      final res = await _dio.post('$_baseUrl/bookings', data: {
        'studentName': studentName,
        'grade': grade,
        'bookingDate': bookingDate,
        'dishId': dishId,
        'dietaryNotes': dietaryNotes ?? 'Без ограничений',
        'price': 75.0,
      });
      if (res.statusCode == 200) {
        return MealBookingModel.fromJson(res.data);
      }
    } catch (_) {}

    final newBooking = MealBookingModel(
      id: DateTime.now().millisecondsSinceEpoch % 10000,
      studentName: studentName,
      grade: grade,
      bookingDate: bookingDate,
      mealType: 'LUNCH',
      dishId: dishId,
      dishName: 'Комплексный школьный обед',
      dietaryNotes: dietaryNotes ?? 'Без ограничений',
      code: 'SC-${1000 + (DateTime.now().millisecond * 7) % 9000}',
      price: 75.0,
      status: 'CONFIRMED',
    );
    _demoBookings.insert(0, newBooking);
    return newBooking;
  }

  Future<MealBookingModel> serveBookingByCode(String code) async {
    try {
      final res = await _dio.post('$_baseUrl/bookings/serve/${Uri.encodeComponent(code)}');
      if (res.statusCode == 200) {
        return MealBookingModel.fromJson(res.data);
      }
    } catch (_) {}

    final idx = _demoBookings.indexWhere((b) => b.code.toUpperCase() == code.toUpperCase());
    if (idx != -1) {
      final b = _demoBookings[idx];
      final updated = MealBookingModel(
        id: b.id,
        studentName: b.studentName,
        grade: b.grade,
        bookingDate: b.bookingDate,
        mealType: b.mealType,
        dishId: b.dishId,
        dishName: b.dishName,
        dietaryNotes: b.dietaryNotes,
        code: b.code,
        price: b.price,
        status: 'SERVED',
        servedAt: DateTime.now().toIso8601String(),
      );
      _demoBookings[idx] = updated;
      return updated;
    }
    throw Exception('Бронирование по коду $code не найдено');
  }

  Future<BookingSummaryModel> fetchBookingSummary({String? date}) async {
    try {
      final res = await _dio.get('$_baseUrl/bookings/summary', queryParameters: date != null ? {'date': date} : null);
      if (res.statusCode == 200) {
        return BookingSummaryModel.fromJson(res.data);
      }
    } catch (_) {}
    final booked = _demoBookings.length;
    final served = _demoBookings.where((b) => b.status == 'SERVED').length;
    return BookingSummaryModel(
      date: date ?? '2026-10-27',
      totalBooked: booked,
      totalServed: served,
      pendingPickup: booked - served,
      totalRevenueKgs: booked * 75.0,
    );
  }

  // --- 4. Inventory Batches ---
  Future<List<InventoryBatchModel>> fetchInventoryBatches() async {
    try {
      final res = await _dio.get('$_baseUrl/inventory/batches');
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((i) => InventoryBatchModel.fromJson(i)).toList();
      }
    } catch (_) {}
    return [
      InventoryBatchModel(id: 1, ingredientId: 1, batchNumber: 'Б-2026-102', remainingQty: 8.5, unit: 'kg', unitCost: 480.0, daysRemaining: 1, expiresAt: '2026-10-29', supplier: 'ОсОО МясоКомбинат'),
      InventoryBatchModel(id: 8, ingredientId: 8, batchNumber: 'Б-МОЛ-73', remainingQty: 12.0, unit: 'l', unitCost: 65.0, daysRemaining: 0, expiresAt: '2026-10-28', supplier: 'Кант-Сут'),
      InventoryBatchModel(id: 9, ingredientId: 9, batchNumber: 'Б-ЯЙЦО-01', remainingQty: 22.0, unit: 'pcs', unitCost: 11.5, daysRemaining: 1, expiresAt: '2026-10-29', supplier: 'Птицефабрика Бишкек'),
      InventoryBatchModel(id: 3, ingredientId: 3, batchNumber: 'Б-2026-104', remainingQty: 28.0, unit: 'kg', unitCost: 130.0, daysRemaining: 15, expiresAt: '2026-11-15', supplier: 'Бакалейная База'),
      InventoryBatchModel(id: 5, ingredientId: 5, batchNumber: 'Б-2026-106', remainingQty: 42.0, unit: 'kg', unitCost: 38.0, daysRemaining: 10, expiresAt: '2026-11-10', supplier: 'АгроФерма Чуй'),
    ];
  }

  // --- 5. Analytics ---
  Future<CanteenAnalyticsModel> fetchAnalytics() async {
    try {
      final res = await _dio.get('$_baseUrl/analytics');
      if (res.statusCode == 200) {
        return CanteenAnalyticsModel.fromJson(res.data);
      }
    } catch (_) {}
    return CanteenAnalyticsModel(
      schoolName: 'Школа-гимназия №24 г. Бишкек',
      currency: 'KGS',
      totalPreparedPortions: 810,
      totalServedPortions: 789,
      totalWastePortions: 13,
      wasteRatePortions: 1.60,
      servedRatePortions: 97.41,
      totalProcurementCost: 18450.0,
      totalWasteCost: 144.0,
      expiringBatchesCount: 3,
    );
  }

  // Seed data fallback
  final List<MealBookingModel> _demoBookings = [
    MealBookingModel(id: 1, studentName: 'Азамат Ибраимов', grade: '7-Б', bookingDate: '2026-10-27', mealType: 'LUNCH', dishName: 'Плов школьный с говядиной', dietaryNotes: 'Без ограничений', code: 'SC-7841', price: 75.0, status: 'SERVED'),
    MealBookingModel(id: 2, studentName: 'Айгерим Садыкова', grade: '9-А', bookingDate: '2026-10-27', mealType: 'LUNCH', dishName: 'Плов школьный с говядиной', dietaryNotes: 'Халяль', code: 'SC-7842', price: 75.0, status: 'SERVED'),
    MealBookingModel(id: 3, studentName: 'Дастан Оморов', grade: '4-В', bookingDate: '2026-10-27', mealType: 'LUNCH', dishName: 'Каша гречневая с котлетой', dietaryNotes: 'Без лактозы', code: 'SC-7843', price: 70.0, status: 'CONFIRMED'),
    MealBookingModel(id: 4, studentName: 'Камила Жумабекова', grade: '11-Б', bookingDate: '2026-10-27', mealType: 'LUNCH', dishName: 'Плов школьный с говядиной', dietaryNotes: 'Без ограничений', code: 'SC-7844', price: 75.0, status: 'CONFIRMED'),
    MealBookingModel(id: 5, studentName: 'Бектур Касымов', grade: '6-А', bookingDate: '2026-10-28', mealType: 'LUNCH', dishName: 'Суп куриный с лапшой', dietaryNotes: 'Обычный', code: 'SC-7845', price: 75.0, status: 'CONFIRMED'),
  ];
}
