import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/post_models.dart';
import 'auth_provider.dart';

class CampaignState {
  final bool isLoading;
  final List<CampaignModel> campaigns;
  final List<PostModel> posts;
  final String? errorMessage;
  final String? successMessage;

  const CampaignState({
    this.isLoading = false,
    this.campaigns = const [],
    this.posts = const [],
    this.errorMessage,
    this.successMessage,
  });

  CampaignState copyWith({
    bool? isLoading,
    List<CampaignModel>? campaigns,
    List<PostModel>? posts,
    String? errorMessage,
    String? successMessage,
    bool clearMessages = false,
  }) {
    return CampaignState(
      isLoading: isLoading ?? this.isLoading,
      campaigns: campaigns ?? this.campaigns,
      posts: posts ?? this.posts,
      errorMessage: clearMessages ? null : (errorMessage ?? this.errorMessage),
      successMessage: clearMessages ? null : (successMessage ?? this.successMessage),
    );
  }
}

class CampaignNotifier extends StateNotifier<CampaignState> {
  final Ref ref;

  CampaignNotifier(this.ref) : super(const CampaignState()) {
    fetchPosts();
    fetchCampaigns();
  }

  Future<void> fetchPosts() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.get('/posts');
      if (response.data is List) {
        final list = (response.data as List)
            .map((e) => PostModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        state = state.copyWith(isLoading: false, posts: list);
      } else {
        state = state.copyWith(isLoading: false, posts: []);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Не удалось загрузить публикации: $e');
    }
  }

  Future<void> fetchCampaigns() async {
    final client = ref.read(apiClientProvider);
    try {
      final response = await client.dio.get('/campaigns');
      if (response.data is List) {
        final list = (response.data as List)
            .map((e) => CampaignModel.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        state = state.copyWith(campaigns: list);
      }
    } catch (_) {}
  }

  Future<CampaignModel?> createCampaign(String goal, {DateTime? start, DateTime? end}) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    final now = DateTime.now();
    final pStart = (start ?? now).toIso8601String().split('T').first;
    final pEnd = (end ?? now.add(const Duration(days: 7))).toIso8601String().split('T').first;

    try {
      final response = await client.dio.post(
        '/campaigns',
        data: {
          'goal': goal,
          'periodStart': pStart,
          'periodEnd': pEnd,
        },
      );
      final campaign = CampaignModel.fromJson(Map<String, dynamic>.from(response.data));
      state = state.copyWith(
        isLoading: false,
        successMessage: 'Кампания успешно сгенерирована!',
        campaigns: [campaign, ...state.campaigns],
      );
      await fetchPosts();
      return campaign;
    } on DioException catch (e) {
      String msg = 'Ошибка генерации кампании';
      if (e.response?.data is Map && e.response?.data['message'] != null) {
        msg = e.response?.data['message'];
      }
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return null;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return null;
    }
  }

  Future<bool> updatePost(int id, {required String text, String? platform, String? mediaUrl, DateTime? scheduledAt}) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.put(
        '/posts/$id',
        data: {
          'text': text,
          if (platform != null) 'platform': platform,
          if (mediaUrl != null) 'mediaUrl': mediaUrl,
          if (scheduledAt != null) 'scheduledAt': scheduledAt.toIso8601String(),
        },
      );
      final updated = PostModel.fromJson(Map<String, dynamic>.from(response.data));
      final updatedList = state.posts.map((p) => p.id == id ? updated : p).toList();
      state = state.copyWith(isLoading: false, posts: updatedList, successMessage: 'Публикация обновлена');
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Не удалось обновить: $e');
      return false;
    }
  }

  Future<bool> verifyPost(int id) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.post('/posts/$id/verify');
      final updated = PostModel.fromJson(Map<String, dynamic>.from(response.data));
      final updatedList = state.posts.map((p) => p.id == id ? updated : p).toList();
      state = state.copyWith(isLoading: false, posts: updatedList);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Ошибка проверки: $e');
      return false;
    }
  }

  Future<bool> approvePost(int id) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.post('/posts/$id/approve');
      final updated = PostModel.fromJson(Map<String, dynamic>.from(response.data));
      final updatedList = state.posts.map((p) => p.id == id ? updated : p).toList();
      state = state.copyWith(isLoading: false, posts: updatedList, successMessage: 'Пост утвержден к публикации');
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Ошибка утверждения: $e');
      return false;
    }
  }

  Future<bool> publishNow(int id) async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.post('/posts/$id/publish-now');
      final updated = PostModel.fromJson(Map<String, dynamic>.from(response.data));
      final updatedList = state.posts.map((p) => p.id == id ? updated : p).toList();
      state = state.copyWith(
        isLoading: false,
        posts: updatedList,
        successMessage: updated.status == 'PUBLISHED'
            ? 'Пост успешно опубликован в канал!'
            : 'Статус: ${updated.status}',
      );
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Ошибка публикации: $e');
      return false;
    }
  }

  Future<int> stopAll() async {
    state = state.copyWith(isLoading: true, clearMessages: true);
    final client = ref.read(apiClientProvider);

    try {
      final response = await client.dio.post('/posts/stop-all');
      int pausedCount = 0;
      if (response.data is Map && response.data['pausedPostsCount'] != null) {
        pausedCount = response.data['pausedPostsCount'];
      }
      await fetchPosts();
      state = state.copyWith(
        isLoading: false,
        successMessage: 'Все публикации остановлены ($pausedCount переведено в паузу)',
      );
      return pausedCount;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Ошибка остановки: $e');
      return 0;
    }
  }

  Future<bool> fixPrice(PostModel post, String wrongPrice, String correctPrice) async {
    final fixedText = post.text.replaceAll(wrongPrice, correctPrice);
    final ok = await updatePost(post.id, text: fixedText, platform: post.platform);
    if (ok) {
      await verifyPost(post.id);
    }
    return ok;
  }
}

final campaignProvider = StateNotifierProvider<CampaignNotifier, CampaignState>((ref) {
  return CampaignNotifier(ref);
});
