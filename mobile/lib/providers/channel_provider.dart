import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/channel_models.dart';
import 'auth_provider.dart';

class ChannelState {
  final bool isLoading;
  final List<ChannelModel> channels;
  final List<PublisherCapabilityModel> capabilities;
  final String? errorMessage;
  final String? successMessage;

  const ChannelState({
    this.isLoading = false,
    this.channels = const [],
    this.capabilities = const [],
    this.errorMessage,
    this.successMessage,
  });

  ChannelState copyWith({
    bool? isLoading,
    List<ChannelModel>? channels,
    List<PublisherCapabilityModel>? capabilities,
    String? errorMessage,
    String? successMessage,
    bool clearMessages = false,
  }) {
    return ChannelState(
      isLoading: isLoading ?? this.isLoading,
      channels: channels ?? this.channels,
      capabilities: capabilities ?? this.capabilities,
      errorMessage: clearMessages ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearMessages ? null : (successMessage ?? this.successMessage),
    );
  }
}

class ChannelNotifier extends StateNotifier<ChannelState> {
  final Ref ref;

  ChannelNotifier(this.ref) : super(const ChannelState()) {
    fetchCapabilities();
    fetchChannels();
  }

  Future<void> fetchCapabilities() async {
    final client = ref.read(apiClientProvider);
    try {
      final response = await client.dio.get('/channels/capabilities');
      if (response.data is List) {
        final list = (response.data as List)
            .map((e) => PublisherCapabilityModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        state = state.copyWith(capabilities: list);
      }
    } catch (_) {}
  }

  Future<void> fetchChannels() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);
    try {
      final response = await client.dio.get('/channels');
      if (response.data is List) {
        final list = (response.data as List)
            .map((e) => ChannelModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        state = state.copyWith(isLoading: false, channels: list);
      } else {
        state = state.copyWith(isLoading: false, channels: []);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Не удалось загрузить каналы: $e');
    }
  }

  Future<bool> connectChannel({required String platform, required String externalId, String? botToken}) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.post(
        '/channels/${platform.toLowerCase()}',
        data: {
          'platform': platform.toUpperCase(),
          'externalId': externalId.trim(),
          if (botToken != null && botToken.isNotEmpty) 'botToken': botToken.trim(),
        },
      );
      final newChannel = ChannelModel.fromJson(Map<String, dynamic>.from(response.data));
      final updatedList = [
        ...state.channels.where((c) => c.platform.toUpperCase() != platform.toUpperCase()),
        newChannel,
      ];
      state = state.copyWith(
        isLoading: false,
        channels: updatedList,
        successMessage: 'Канал $platform успешно подключен!',
      );
      return true;
    } on DioException catch (e) {
      String msg = 'Ошибка подключения канала';
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

final channelProvider = StateNotifierProvider<ChannelNotifier, ChannelState>((ref) {
  return ChannelNotifier(ref);
});
