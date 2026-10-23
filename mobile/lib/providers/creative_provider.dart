import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/creative_models.dart';
import 'auth_provider.dart';

class CreativeState {
  final bool isLoading;
  final bool isGenerating;
  final String? errorMessage;
  final CreativeTaskModel? currentTask;
  final MediaAssetModel? latestMedia;
  final List<MediaAssetModel> mediaList;
  final List<CreativePresetModel> presets;

  CreativeState({
    this.isLoading = false,
    this.isGenerating = false,
    this.errorMessage,
    this.currentTask,
    this.latestMedia,
    this.mediaList = const [],
    this.presets = const [],
  });

  CreativeState copyWith({
    bool? isLoading,
    bool? isGenerating,
    String? errorMessage,
    CreativeTaskModel? currentTask,
    MediaAssetModel? latestMedia,
    List<MediaAssetModel>? mediaList,
    List<CreativePresetModel>? presets,
  }) {
    return CreativeState(
      isLoading: isLoading ?? this.isLoading,
      isGenerating: isGenerating ?? this.isGenerating,
      errorMessage: errorMessage,
      currentTask: currentTask ?? this.currentTask,
      latestMedia: latestMedia ?? this.latestMedia,
      mediaList: mediaList ?? this.mediaList,
      presets: presets ?? this.presets,
    );
  }
}

class CreativeNotifier extends StateNotifier<CreativeState> {
  final Ref ref;
  Timer? _pollingTimer;

  CreativeNotifier(this.ref) : super(CreativeState()) {
    init();
  }

  Future<void> init() async {
    state = state.copyWith(isLoading: true);
    await Future.wait([
      loadPresets(),
      loadMedia(),
    ]);
    state = state.copyWith(isLoading: false);
  }

  Future<void> loadPresets() async {
    try {
      final client = ref.read(apiClientProvider);
      final response = await client.dio.get('/creative/presets');
      if (response.data is List) {
        final presets = (response.data as List).map((e) => CreativePresetModel.fromJson(e as Map<String, dynamic>)).toList();
        state = state.copyWith(presets: presets);
      }
    } catch (e) {
      debugPrint('Failed to load creative presets: $e');
    }
  }

  Future<void> loadMedia() async {
    try {
      final client = ref.read(apiClientProvider);
      final response = await client.dio.get('/creative/media');
      if (response.data is List) {
        final media = (response.data as List).map((e) => MediaAssetModel.fromJson(e as Map<String, dynamic>)).toList();
        state = state.copyWith(mediaList: media);
      }
    } catch (e) {
      debugPrint('Failed to load media assets: $e');
    }
  }

  Future<MediaAssetModel?> generateImage({
    required String prompt,
    required String style,
    required String aspectRatio,
    required bool enableOverlay,
    String? brandName,
    String? price,
    String? badgeText,
    String? ctaText,
    String? overlayPosition,
  }) async {
    state = state.copyWith(isGenerating: true, errorMessage: null);
    try {
      final client = ref.read(apiClientProvider);
      final response = await client.dio.post('/creative/images', data: {
        'prompt': prompt,
        'style': style,
        'aspectRatio': aspectRatio,
        'enableOverlay': enableOverlay,
        'brandName': brandName,
        'price': price,
        'badgeText': badgeText,
        'ctaText': ctaText,
        'overlayPosition': overlayPosition ?? 'BOTTOM_CENTER',
      });

      final task = CreativeTaskModel.fromJson(response.data);
      state = state.copyWith(currentTask: task);

      if (task.status == 'COMPLETED' && task.resultUrl != null) {
        final media = MediaAssetModel(
          id: DateTime.now().millisecondsSinceEpoch,
          taskId: task.id,
          mediaType: 'IMAGE',
          url: task.resultUrl!,
          thumbnailUrl: task.resultUrl!,
          prompt: task.prompt,
          style: task.style,
          aspectRatio: task.aspectRatio,
          createdAt: DateTime.now(),
        );
        state = state.copyWith(latestMedia: media, isGenerating: false);
        loadMedia();
        return media;
      }
      state = state.copyWith(isGenerating: false);
      return null;
    } catch (e) {
      state = state.copyWith(isGenerating: false, errorMessage: e.toString());
      return null;
    }
  }

  Future<void> createVideo({
    required String prompt,
    required String style,
    required String aspectRatio,
    required int durationSeconds,
    required String cameraMotion,
    required bool enableOverlay,
    String? brandName,
    String? price,
    String? badgeText,
  }) async {
    state = state.copyWith(isGenerating: true, errorMessage: null);
    try {
      final client = ref.read(apiClientProvider);
      final response = await client.dio.post('/creative/videos', data: {
        'prompt': prompt,
        'style': style,
        'aspectRatio': aspectRatio,
        'durationSeconds': durationSeconds,
        'cameraMotion': cameraMotion,
        'enableOverlay': enableOverlay,
        'brandName': brandName,
        'price': price,
        'badgeText': badgeText,
      });

      final task = CreativeTaskModel.fromJson(response.data);
      state = state.copyWith(currentTask: task);
      _startPolling(task.id);
    } catch (e) {
      state = state.copyWith(isGenerating: false, errorMessage: e.toString());
    }
  }

  void _startPolling(int taskId) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 2), (timer) async {
      try {
        final client = ref.read(apiClientProvider);
        final response = await client.dio.get('/creative/tasks/$taskId');
        final updated = CreativeTaskModel.fromJson(response.data);
        state = state.copyWith(currentTask: updated);

        if (updated.status == 'COMPLETED' || updated.status == 'FAILED') {
          timer.cancel();
          state = state.copyWith(isGenerating: false);

          if (updated.status == 'COMPLETED' && updated.resultUrl != null) {
            final media = MediaAssetModel(
              id: DateTime.now().millisecondsSinceEpoch,
              taskId: updated.id,
              mediaType: 'VIDEO',
              url: updated.resultUrl!,
              thumbnailUrl: updated.resultUrl!,
              prompt: updated.prompt,
              style: updated.style,
              aspectRatio: updated.aspectRatio,
              createdAt: DateTime.now(),
            );
            state = state.copyWith(latestMedia: media);
            loadMedia();
          }
        }
      } catch (e) {
        timer.cancel();
        state = state.copyWith(isGenerating: false);
      }
    });
  }

  Future<bool> attachToPost({
    required int mediaId,
    required String platform,
    required String postText,
  }) async {
    try {
      final client = ref.read(apiClientProvider);
      await client.dio.post('/creative/media/$mediaId/attach-post', data: {
        'platform': platform,
        'postText': postText,
      });
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: e.toString());
      return false;
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

final creativeProvider = StateNotifierProvider<CreativeNotifier, CreativeState>((ref) {
  return CreativeNotifier(ref);
});
