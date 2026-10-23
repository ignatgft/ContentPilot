import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String defaultBaseUrl = 'http://192.168.10.181:8080/api/v1';
  static const String emulatorBaseUrl = 'http://10.0.2.2:8080/api/v1';

  final Dio dio;
  final FlutterSecureStorage storage;

  ApiClient({String? baseUrl, FlutterSecureStorage? storageInstance})
      : storage = storageInstance ?? const FlutterSecureStorage(),
        dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? defaultBaseUrl,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Client': 'mobile',
          },
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 15),
        )) {
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'access_token');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        // Auto refresh token on 401
        if (error.response?.statusCode == 401 && !error.requestOptions.path.contains('/auth/')) {
          final refreshToken = await storage.read(key: 'refresh_token');
          if (refreshToken != null) {
            try {
              final refreshResponse = await dio.post(
                '/auth/refresh',
                data: {'refreshToken': refreshToken},
                options: Options(headers: {'X-Client': 'mobile'}),
              );
              final newAccessToken = refreshResponse.data['token'];
              final newRefreshToken = refreshResponse.data['refreshToken'];

              await storage.write(key: 'access_token', value: newAccessToken);
              if (newRefreshToken != null) {
                await storage.write(key: 'refresh_token', value: newRefreshToken);
              }

              // Retry original request with new token
              error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
              final retryResponse = await dio.fetch(error.requestOptions);
              return handler.resolve(retryResponse);
            } catch (_) {
              await storage.deleteAll();
            }
          }
        }
        return handler.next(error);
      },
    ));
  }
}
