import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/analytics_models.dart';
import 'auth_provider.dart';

class AnalyticsState {
  final bool isLoading;
  final AnalyticsOverviewModel? overview;
  final String? errorMessage;

  const AnalyticsState({
    this.isLoading = false,
    this.overview,
    this.errorMessage,
  });

  AnalyticsState copyWith({
    bool? isLoading,
    AnalyticsOverviewModel? overview,
    String? errorMessage,
  }) {
    return AnalyticsState(
      isLoading: isLoading ?? this.isLoading,
      overview: overview ?? this.overview,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

class AnalyticsNotifier extends StateNotifier<AnalyticsState> {
  final Ref ref;

  AnalyticsNotifier(this.ref) : super(const AnalyticsState()) {
    fetchOverview();
  }

  Future<void> fetchOverview() async {
    state = state.copyWith(isLoading: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.get('/analytics/overview');
      if (response.statusCode == 200 && response.data != null) {
        final overview = AnalyticsOverviewModel.fromJson(Map<String, dynamic>.from(response.data));
        state = AnalyticsState(isLoading: false, overview: overview);
      } else {
        state = const AnalyticsState(isLoading: false, overview: null);
      }
    } catch (e) {
      state = AnalyticsState(isLoading: false, errorMessage: 'Не удалось загрузить аналитику: $e');
    }
  }
}

final analyticsProvider = StateNotifierProvider<AnalyticsNotifier, AnalyticsState>((ref) {
  return AnalyticsNotifier(ref);
});
