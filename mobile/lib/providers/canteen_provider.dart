import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/canteen_api_client.dart';
import '../models/canteen_models.dart';

// User role: 'STUDENT' (Школьник/Родитель) or 'STAFF' (Персонал столовой)
final userRoleProvider = StateProvider<String>((ref) => 'STUDENT');

// Selected date for canteen operations
final selectedDateProvider = StateProvider<String>((ref) {
  final now = DateTime.now();
  return "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
});

// School info provider
final schoolProvider = FutureProvider<SchoolModel>((ref) async {
  return CanteenApiClient().fetchSchool();
});

// Dishes provider
final dishesProvider = FutureProvider<List<DishModel>>((ref) async {
  return CanteenApiClient().fetchDishes();
});

// Bookings Notifier Provider for dynamic list updates
class BookingsNotifier extends StateNotifier<AsyncValue<List<MealBookingModel>>> {
  BookingsNotifier() : super(const AsyncValue.loading()) {
    loadBookings();
  }

  Future<void> loadBookings({String? date, String? grade, String? status}) async {
    state = const AsyncValue.loading();
    try {
      final list = await CanteenApiClient().fetchBookings(date: date, grade: grade, status: status);
      state = AsyncValue.data(list);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<MealBookingModel> createBooking({
    required String studentName,
    required String grade,
    required String bookingDate,
    int? dishId,
    String? dietaryNotes,
  }) async {
    final created = await CanteenApiClient().createBooking(
      studentName: studentName,
      grade: grade,
      bookingDate: bookingDate,
      dishId: dishId,
      dietaryNotes: dietaryNotes,
    );
    // Optimistic update
    state.whenData((list) {
      state = AsyncValue.data([created, ...list]);
    });
    return created;
  }

  Future<MealBookingModel> serveBookingByCode(String code) async {
    final served = await CanteenApiClient().serveBookingByCode(code);
    state.whenData((list) {
      final updatedList = list.map((b) => b.code.toUpperCase() == code.toUpperCase() ? served : b).toList();
      state = AsyncValue.data(updatedList);
    });
    return served;
  }
}

final bookingsProvider = StateNotifierProvider<BookingsNotifier, AsyncValue<List<MealBookingModel>>>((ref) {
  return BookingsNotifier();
});

// Summary Provider
final bookingSummaryProvider = FutureProvider<BookingSummaryModel>((ref) async {
  final date = ref.watch(selectedDateProvider);
  return CanteenApiClient().fetchBookingSummary(date: date);
});

// Inventory Batches Provider
final inventoryBatchesProvider = FutureProvider<List<InventoryBatchModel>>((ref) async {
  return CanteenApiClient().fetchInventoryBatches();
});

// Analytics Provider
final analyticsProvider = FutureProvider<CanteenAnalyticsModel>((ref) async {
  return CanteenApiClient().fetchAnalytics();
});
