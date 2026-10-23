import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../models/auth_models.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final UserInfo? user;
  final String? errorMessage;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    UserInfo? user,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient apiClient;

  AuthNotifier(this.apiClient) : super(const AuthState(isLoading: true)) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final token = await apiClient.storage.read(key: 'access_token');
      if (token == null || token.isEmpty) {
        state = const AuthState(isLoading: false, isAuthenticated: false);
        return;
      }

      final response = await apiClient.dio.get('/auth/me');
      if (response.statusCode == 200 && response.data != null) {
        final user = UserInfo.fromJson(Map<String, dynamic>.from(response.data));
        state = AuthState(
          isLoading: false,
          isAuthenticated: true,
          user: user,
        );
      } else {
        await apiClient.storage.deleteAll();
        state = const AuthState(isLoading: false, isAuthenticated: false);
      }
    } catch (_) {
      state = const AuthState(isLoading: false, isAuthenticated: false);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await apiClient.dio.post(
        '/auth/login',
        data: {'email': email.trim(), 'password': password},
      );

      final authResponse = AuthResponse.fromJson(Map<String, dynamic>.from(response.data));
      await apiClient.storage.write(key: 'access_token', value: authResponse.token);
      if (authResponse.refreshToken != null) {
        await apiClient.storage.write(key: 'refresh_token', value: authResponse.refreshToken!);
      }

      state = AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: authResponse.user,
      );
      return true;
    } on DioException catch (e) {
      String message = 'Ошибка авторизации';
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        message = e.response?.data['message'];
      } else if (e.response?.statusCode == 401) {
        message = 'Неверный email или пароль';
      }
      state = state.copyWith(isLoading: false, errorMessage: message);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<bool> register(String email, String password, String name) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final response = await apiClient.dio.post(
        '/auth/register',
        data: {
          'email': email.trim(),
          'password': password,
          'name': name.trim().isEmpty ? email.split('@').first : name.trim(),
        },
      );

      final authResponse = AuthResponse.fromJson(Map<String, dynamic>.from(response.data));
      await apiClient.storage.write(key: 'access_token', value: authResponse.token);
      if (authResponse.refreshToken != null) {
        await apiClient.storage.write(key: 'refresh_token', value: authResponse.refreshToken!);
      }

      state = AuthState(
        isLoading: false,
        isAuthenticated: true,
        user: authResponse.user,
      );
      return true;
    } on DioException catch (e) {
      String message = 'Ошибка регистрации';
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        message = e.response?.data['message'];
      }
      state = state.copyWith(isLoading: false, errorMessage: message);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await apiClient.dio.post('/auth/logout');
    } catch (_) {}
    await apiClient.storage.deleteAll();
    state = const AuthState(isLoading: false, isAuthenticated: false);
  }
}

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthNotifier(client);
});
