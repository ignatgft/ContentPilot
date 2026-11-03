import 'package:flutter_test/flutter_test.dart';
import 'package:contentpilot_mobile/models/canteen_models.dart';

void main() {
  group('Canteen Models Tests', () {
    test('SchoolModel fromJson parses correctly', () {
      final json = {
        'id': 1,
        'name': 'Школа №24 г. Бишкек',
        'address': 'ул. Тыныстанова 110',
        'currency': 'KGS',
        'timezone': 'Asia/Bishkek',
        'totalStudents': 650,
      };

      final school = SchoolModel.fromJson(json);

      expect(school.id, 1);
      expect(school.name, 'Школа №24 г. Бишкек');
      expect(school.currency, 'KGS');
      expect(school.totalStudents, 650);
    });

    test('MealBookingModel fromJson parses correctly', () {
      final json = {
        'id': 10,
        'studentName': 'Азамат Ибраимов',
        'grade': '7-Б',
        'bookingDate': '2026-10-27',
        'mealType': 'LUNCH',
        'dishName': 'Плов с говядиной',
        'code': 'SC-7841',
        'price': 75.0,
        'status': 'CONFIRMED',
      };

      final booking = MealBookingModel.fromJson(json);

      expect(booking.id, 10);
      expect(booking.studentName, 'Азамат Ибраимов');
      expect(booking.code, 'SC-7841');
      expect(booking.price, 75.0);
      expect(booking.status, 'CONFIRMED');
    });

    test('BookingSummaryModel calculates pendingPickup correctly', () {
      final summary = BookingSummaryModel(
        date: '2026-10-27',
        totalBooked: 100,
        totalServed: 84,
        pendingPickup: 16,
        totalRevenueKgs: 7500.0,
      );

      expect(summary.totalBooked, 100);
      expect(summary.totalServed, 84);
      expect(summary.pendingPickup, 16);
      expect(summary.totalRevenueKgs, 7500.0);
    });
  });
}
