class SchoolModel {
  final int id;
  final String name;
  final String address;
  final String currency;
  final String timezone;
  final int totalStudents;

  SchoolModel({
    required this.id,
    required this.name,
    required this.address,
    required this.currency,
    required this.timezone,
    required this.totalStudents,
  });

  factory SchoolModel.fromJson(Map<String, dynamic> json) {
    return SchoolModel(
      id: json['id'] ?? 1,
      name: json['name'] ?? 'Школа-гимназия №24 г. Бишкек',
      address: json['address'] ?? 'ул. Тыныстанова, 110',
      currency: json['currency'] ?? 'KGS',
      timezone: json['timezone'] ?? 'Asia/Bishkek',
      totalStudents: json['totalStudents'] ?? 650,
    );
  }
}

class DishModel {
  final int id;
  final String name;
  final String category;
  final String description;
  final double price;

  DishModel({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    this.price = 75.0,
  });

  factory DishModel.fromJson(Map<String, dynamic> json) {
    return DishModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      category: json['category'] ?? 'Горячие блюда',
      description: json['description'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 75.0,
    );
  }
}

class MealBookingModel {
  final int id;
  final String studentName;
  final String grade;
  final String bookingDate;
  final String mealType;
  final int? dishId;
  final String dishName;
  final String? dietaryNotes;
  final String code;
  final double price;
  final String status; // CONFIRMED, SERVED, CANCELLED
  final String? servedAt;

  MealBookingModel({
    required this.id,
    required this.studentName,
    required this.grade,
    required this.bookingDate,
    required this.mealType,
    this.dishId,
    required this.dishName,
    this.dietaryNotes,
    required this.code,
    required this.price,
    required this.status,
    this.servedAt,
  });

  factory MealBookingModel.fromJson(Map<String, dynamic> json) {
    return MealBookingModel(
      id: json['id'] ?? 0,
      studentName: json['studentName'] ?? 'Ученик',
      grade: json['grade'] ?? '1-А',
      bookingDate: json['bookingDate'] ?? '',
      mealType: json['mealType'] ?? 'LUNCH',
      dishId: json['dishId'],
      dishName: json['dishName'] ?? 'Комплексный обед',
      dietaryNotes: json['dietaryNotes'],
      code: json['code'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 75.0,
      status: json['status'] ?? 'CONFIRMED',
      servedAt: json['servedAt'],
    );
  }
}

class BookingSummaryModel {
  final String date;
  final int totalBooked;
  final int totalServed;
  final int pendingPickup;
  final double totalRevenueKgs;

  BookingSummaryModel({
    required this.date,
    required this.totalBooked,
    required this.totalServed,
    required this.pendingPickup,
    required this.totalRevenueKgs,
  });

  factory BookingSummaryModel.fromJson(Map<String, dynamic> json) {
    return BookingSummaryModel(
      date: json['date'] ?? '',
      totalBooked: json['totalBooked'] ?? 0,
      totalServed: json['totalServed'] ?? 0,
      pendingPickup: json['pendingPickup'] ?? 0,
      totalRevenueKgs: (json['totalRevenueKgs'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class InventoryBatchModel {
  final int id;
  final int ingredientId;
  final String batchNumber;
  final double remainingQty;
  final String unit;
  final double unitCost;
  final String? expiresAt;
  final int daysRemaining;
  final String supplier;

  InventoryBatchModel({
    required this.id,
    required this.ingredientId,
    required this.batchNumber,
    required this.remainingQty,
    required this.unit,
    required this.unitCost,
    this.expiresAt,
    required this.daysRemaining,
    required this.supplier,
  });

  factory InventoryBatchModel.fromJson(Map<String, dynamic> json) {
    return InventoryBatchModel(
      id: json['id'] ?? 0,
      ingredientId: json['ingredientId'] ?? 0,
      batchNumber: json['batchNumber'] ?? '',
      remainingQty: (json['remainingQty'] as num?)?.toDouble() ?? 0.0,
      unit: json['unit'] ?? 'kg',
      unitCost: (json['unitCost'] as num?)?.toDouble() ?? 0.0,
      expiresAt: json['expiresAt'],
      daysRemaining: json['daysRemaining'] ?? 0,
      supplier: json['supplier'] ?? 'Поставщик',
    );
  }
}

class CanteenAnalyticsModel {
  final String schoolName;
  final String currency;
  final int totalPreparedPortions;
  final int totalServedPortions;
  final int totalWastePortions;
  final double wasteRatePortions;
  final double servedRatePortions;
  final double totalProcurementCost;
  final double totalWasteCost;
  final int expiringBatchesCount;

  CanteenAnalyticsModel({
    required this.schoolName,
    required this.currency,
    required this.totalPreparedPortions,
    required this.totalServedPortions,
    required this.totalWastePortions,
    required this.wasteRatePortions,
    required this.servedRatePortions,
    required this.totalProcurementCost,
    required this.totalWasteCost,
    required this.expiringBatchesCount,
  });

  factory CanteenAnalyticsModel.fromJson(Map<String, dynamic> json) {
    return CanteenAnalyticsModel(
      schoolName: json['schoolName'] ?? 'Школа №24',
      currency: json['currency'] ?? 'KGS',
      totalPreparedPortions: json['totalPreparedPortions'] ?? 0,
      totalServedPortions: json['totalServedPortions'] ?? 0,
      totalWastePortions: json['totalWastePortions'] ?? 0,
      wasteRatePortions: (json['wasteRatePortions'] as num?)?.toDouble() ?? 0.0,
      servedRatePortions: (json['servedRatePortions'] as num?)?.toDouble() ?? 0.0,
      totalProcurementCost: (json['totalProcurementCost'] as num?)?.toDouble() ?? 0.0,
      totalWasteCost: (json['totalWasteCost'] as num?)?.toDouble() ?? 0.0,
      expiringBatchesCount: json['expiringBatchesCount'] ?? 0,
    );
  }
}
