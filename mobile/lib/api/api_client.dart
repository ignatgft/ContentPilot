import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String tunnelBaseUrl = 'https://allows-thread-dedicated-screening.trycloudflare.com/api/v1';
  static const String lanBaseUrl = 'http://192.168.10.181:8080/api/v1';
  static const String emulatorBaseUrl = 'http://10.0.2.2:8080/api/v1';

  late Dio dio;
  final FlutterSecureStorage storage;
  String currentBaseUrl;

  ApiClient({String? baseUrl, FlutterSecureStorage? storageInstance})
      : storage = storageInstance ?? const FlutterSecureStorage(),
        currentBaseUrl = baseUrl ?? tunnelBaseUrl {
    _initDio();
  }

  void updateBaseUrl(String newBaseUrl) {
    currentBaseUrl = newBaseUrl;
    dio.options.baseUrl = newBaseUrl;
  }

  void _initDio() {
    dio = Dio(BaseOptions(
      baseUrl: currentBaseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client': 'mobile',
      },
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.read(key: 'access_token');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 401 && !error.requestOptions.path.contains('/auth/')) {
          final refreshToken = await storage.read(key: 'refresh_token');
          if (refreshToken != null && refreshToken.isNotEmpty) {
            try {
              final refreshResponse = await dio.post(
                '/auth/refresh',
                data: {'refreshToken': refreshToken},
                options: Options(headers: {'X-Client': 'mobile'}),
              );
              final newAccessToken = refreshResponse.data['token'];
              final newRefreshToken = refreshResponse.data['refreshToken'];

              if (newAccessToken != null) {
                await storage.write(key: 'access_token', value: newAccessToken);
              }
              if (newRefreshToken != null) {
                await storage.write(key: 'refresh_token', value: newRefreshToken);
              }

              error.requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
              final retryResponse = await dio.fetch(error.requestOptions);
              return handler.resolve(retryResponse);
            } catch (_) {
              await storage.delete(key: 'access_token');
              await storage.delete(key: 'refresh_token');
            }
          }
        }
        return handler.next(error);
      },
    ));
  }
}
