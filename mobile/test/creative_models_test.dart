import 'package:flutter_test/flutter_test.dart';
import 'package:contentpilot_mobile/models/creative_models.dart';

void main() {
  group('Creative Models Serialization Tests', () {
    test('CreativeTaskModel.fromJson parses fields correctly', () {
      final json = {
        'id': 42,
        'type': 'VIDEO',
        'provider': 'FFMPEG_MOTION_ENGINE',
        'model': 'ffmpeg-zoom-v1',
        'prompt': 'Капучино с латте-артом',
        'aspectRatio': '9:16',
        'style': 'COFFEE_AESTHETIC',
        'status': 'COMPLETED',
        'progress': 100,
        'resultUrl': '/uploads/creative/vid_42.mp4',
        'createdAt': '2026-10-23T12:00:00Z',
      };

      final model = CreativeTaskModel.fromJson(json);

      expect(model.id, equals(42));
      expect(model.type, equals('VIDEO'));
      expect(model.provider, equals('FFMPEG_MOTION_ENGINE'));
      expect(model.prompt, equals('Капучино с латте-артом'));
      expect(model.aspectRatio, equals('9:16'));
      expect(model.status, equals('COMPLETED'));
      expect(model.progress, equals(100));
      expect(model.resultUrl, equals('/uploads/creative/vid_42.mp4'));
    });

    test('MediaAssetModel.fromJson parses fields correctly', () {
      final json = {
        'id': 101,
        'taskId': 42,
        'mediaType': 'IMAGE',
        'url': '/uploads/creative/img_101.png',
        'thumbnailUrl': '/uploads/creative/img_101.png',
        'prompt': 'Свежий круассан',
        'aspectRatio': '1:1',
        'width': 1080,
        'height': 1080,
        'createdAt': '2026-10-23T12:05:00Z',
      };

      final asset = MediaAssetModel.fromJson(json);

      expect(asset.id, equals(101));
      expect(asset.taskId, equals(42));
      expect(asset.mediaType, equals('IMAGE'));
      expect(asset.url, equals('/uploads/creative/img_101.png'));
      expect(asset.width, equals(1080));
      expect(asset.height, equals(1080));
      expect(asset.aspectRatio, equals('1:1'));
    });

    test('CreativePresetModel.fromJson parses presets correctly', () {
      final json = {
        'id': 'latte-art-cozy',
        'title': 'Уютный кофе',
        'description': 'Чашка латте',
        'prompt': 'Капучино с артом',
        'style': 'COFFEE_AESTHETIC',
        'defaultAspectRatio': '1:1',
        'suggestedBadge': 'Сезонная новинка',
        'suggestedCta': 'Попробовать',
        'category': 'Напитки',
      };

      final preset = CreativePresetModel.fromJson(json);

      expect(preset.id, equals('latte-art-cozy'));
      expect(preset.title, equals('Уютный кофе'));
      expect(preset.defaultAspectRatio, equals('1:1'));
      expect(preset.suggestedBadge, equals('Сезонная новинка'));
      expect(preset.suggestedCta, equals('Попробовать'));
    });
  });
}
