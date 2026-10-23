class CreativeTaskModel {
  final int id;
  final String type; // IMAGE, VIDEO
  final String provider;
  final String model;
  final String prompt;
  final String aspectRatio;
  final String? style;
  final String status; // PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
  final int progress;
  final String? resultUrl;
  final String? errorMessage;
  final DateTime createdAt;

  CreativeTaskModel({
    required this.id,
    required this.type,
    required this.provider,
    required this.model,
    required this.prompt,
    required this.aspectRatio,
    this.style,
    required this.status,
    required this.progress,
    this.resultUrl,
    this.errorMessage,
    required this.createdAt,
  });

  factory CreativeTaskModel.fromJson(Map<String, dynamic> json) {
    return CreativeTaskModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      type: json['type'] ?? 'IMAGE',
      provider: json['provider'] ?? '',
      model: json['model'] ?? '',
      prompt: json['prompt'] ?? '',
      aspectRatio: json['aspectRatio'] ?? '1:1',
      style: json['style'],
      status: json['status'] ?? 'PENDING',
      progress: json['progress'] ?? 0,
      resultUrl: json['resultUrl'],
      errorMessage: json['errorMessage'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}

class MediaAssetModel {
  final int id;
  final int? taskId;
  final String mediaType; // IMAGE, VIDEO
  final String url;
  final String thumbnailUrl;
  final String prompt;
  final String? style;
  final String aspectRatio;
  final int? width;
  final int? height;
  final int? durationSeconds;
  final DateTime createdAt;

  MediaAssetModel({
    required this.id,
    this.taskId,
    required this.mediaType,
    required this.url,
    required this.thumbnailUrl,
    required this.prompt,
    this.style,
    required this.aspectRatio,
    this.width,
    this.height,
    this.durationSeconds,
    required this.createdAt,
  });

  factory MediaAssetModel.fromJson(Map<String, dynamic> json) {
    return MediaAssetModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      taskId: json['taskId'],
      mediaType: json['mediaType'] ?? 'IMAGE',
      url: json['url'] ?? '',
      thumbnailUrl: json['thumbnailUrl'] ?? json['url'] ?? '',
      prompt: json['prompt'] ?? '',
      style: json['style'],
      aspectRatio: json['aspectRatio'] ?? '1:1',
      width: json['width'],
      height: json['height'],
      durationSeconds: json['durationSeconds'],
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}

class CreativePresetModel {
  final String id;
  final String title;
  final String description;
  final String prompt;
  final String style;
  final String defaultAspectRatio;
  final String suggestedBadge;
  final String suggestedCta;
  final String category;

  CreativePresetModel({
    required this.id,
    required this.title,
    required this.description,
    required this.prompt,
    required this.style,
    required this.defaultAspectRatio,
    required this.suggestedBadge,
    required this.suggestedCta,
    required this.category,
  });

  factory CreativePresetModel.fromJson(Map<String, dynamic> json) {
    return CreativePresetModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      prompt: json['prompt'] ?? '',
      style: json['style'] ?? 'COFFEE_AESTHETIC',
      defaultAspectRatio: json['defaultAspectRatio'] ?? '1:1',
      suggestedBadge: json['suggestedBadge'] ?? '',
      suggestedCta: json['suggestedCta'] ?? '',
      category: json['category'] ?? '',
    );
  }
}
