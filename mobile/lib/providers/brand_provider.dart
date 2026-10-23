import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/brand_models.dart';
import 'auth_provider.dart';

class BrandState {
  final bool isLoading;
  final BrandModel? brand;
  final String? errorMessage;
  final bool isSuccess;

  const BrandState({
    this.isLoading = false,
    this.brand,
    this.errorMessage,
    this.isSuccess = false,
  });

  BrandState copyWith({
    bool? isLoading,
    BrandModel? brand,
    String? errorMessage,
    bool? isSuccess,
    bool clearError = false,
  }) {
    return BrandState(
      isLoading: isLoading ?? this.isLoading,
      brand: brand ?? this.brand,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      isSuccess: isSuccess ?? this.isSuccess,
    );
  }
}

class BrandNotifier extends StateNotifier<BrandState> {
  final Ref ref;

  BrandNotifier(this.ref) : super(const BrandState()) {
    fetchBrand();
  }

  Future<void> fetchBrand() async {
    state = state.copyWith(isLoading: true, clearError: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.get('/brands/me');
      if (response.statusCode == 200 && response.data != null) {
        final brand = BrandModel.fromJson(Map<String, dynamic>.from(response.data));
        state = BrandState(isLoading: false, brand: brand);
      } else {
        state = const BrandState(isLoading: false, brand: null);
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        state = const BrandState(isLoading: false, brand: null);
      } else {
        state = state.copyWith(isLoading: false, errorMessage: 'Не удалось загрузить бренд');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  Future<bool> saveBrand(BrandModel brand) async {
    state = state.copyWith(isLoading: true, clearError: true, isSuccess: false);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.post(
        '/brands',
        data: brand.toJson(),
      );
      final saved = BrandModel.fromJson(Map<String, dynamic>.from(response.data));
      state = BrandState(isLoading: false, brand: saved, isSuccess: true);
      return true;
    } on DioException catch (e) {
      String msg = 'Ошибка сохранения бренда';
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        msg = e.response?.data['message'];
      }
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }
}

final brandProvider = StateNotifierProvider<BrandNotifier, BrandState>((ref) {
  return BrandNotifier(ref);
});
