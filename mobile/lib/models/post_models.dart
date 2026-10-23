class VerificationResult {
  final int? id;
  final String? checkType;
  final String? status;
  final String? message;

  VerificationResult({
    this.id,
    this.checkType,
    this.status,
    this.message,
  });

  factory VerificationResult.fromJson(Map<String, dynamic> json) {
    return VerificationResult(
      id: json['id'] != null ? (json['id'] is int ? json['id'] : int.tryParse(json['id'].toString())) : null,
      checkType: json['checkType'],
      status: json['status'],
      message: json['message'],
    );
  }
}

class PostModel {
  final int id;
  final int? campaignId;
  final String platform;
  final String text;
  final String? mediaUrl;
  final String status;
  final DateTime? scheduledAt;
  final DateTime? publishedAt;
  final String? error;
  final DateTime? createdAt;
  final List<VerificationResult> verificationResults;

  PostModel({
    required this.id,
    this.campaignId,
    required this.platform,
    required this.text,
    this.mediaUrl,
    required this.status,
    this.scheduledAt,
    this.publishedAt,
    this.error,
    this.createdAt,
    this.verificationResults = const [],
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    List<VerificationResult> verifications = [];
    if (json['verificationResults'] is List) {
      verifications = (json['verificationResults'] as List)
          .map((e) => VerificationResult.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }

    return PostModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      campaignId: json['campaignId'] != null ? (json['campaignId'] is int ? json['campaignId'] : int.tryParse(json['campaignId'].toString())) : null,
      platform: json['platform'] ?? 'TELEGRAM',
      text: json['text'] ?? '',
      mediaUrl: json['mediaUrl'],
      status: json['status'] ?? 'DRAFT',
      scheduledAt: json['scheduledAt'] != null ? DateTime.tryParse(json['scheduledAt'].toString()) : null,
      publishedAt: json['publishedAt'] != null ? DateTime.tryParse(json['publishedAt'].toString()) : null,
      error: json['error'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      verificationResults: verifications,
    );
  }

  PostModel copyWith({
    int? id,
    int? campaignId,
    String? platform,
    String? text,
    String? mediaUrl,
    String? status,
    DateTime? scheduledAt,
    DateTime? publishedAt,
    String? error,
    DateTime? createdAt,
    List<VerificationResult>? verificationResults,
  }) {
    return PostModel(
      id: id ?? this.id,
      campaignId: campaignId ?? this.campaignId,
      platform: platform ?? this.platform,
      text: text ?? this.text,
      mediaUrl: mediaUrl ?? this.mediaUrl,
      status: status ?? this.status,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      publishedAt: publishedAt ?? this.publishedAt,
      error: error ?? this.error,
      createdAt: createdAt ?? this.createdAt,
      verificationResults: verificationResults ?? this.verificationResults,
    );
  }
}

class CampaignModel {
  final int id;
  final int? brandId;
  final String goal;
  final String? periodStart;
  final String? periodEnd;
  final String? status;
  final DateTime? createdAt;
  final List<PostModel> posts;

  CampaignModel({
    required this.id,
    this.brandId,
    required this.goal,
    this.periodStart,
    this.periodEnd,
    this.status,
    this.createdAt,
    this.posts = const [],
  });

  factory CampaignModel.fromJson(Map<String, dynamic> json) {
    List<PostModel> parsedPosts = [];
    if (json['posts'] is List) {
      parsedPosts = (json['posts'] as List)
          .map((e) => PostModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }

    return CampaignModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      brandId: json['brandId'] != null ? (json['brandId'] is int ? json['brandId'] : int.tryParse(json['brandId'].toString())) : null,
      goal: json['goal'] ?? '',
      periodStart: json['periodStart']?.toString(),
      periodEnd: json['periodEnd']?.toString(),
      status: json['status'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      posts: parsedPosts,
    );
  }
}
