class PostMetricDetailModel {
  final int postId;
  final String platform;
  final String text;
  final int views;
  final int reactions;
  final int clicks;

  PostMetricDetailModel({
    required this.postId,
    required this.platform,
    required this.text,
    required this.views,
    required this.reactions,
    required this.clicks,
  });

  factory PostMetricDetailModel.fromJson(Map<String, dynamic> json) {
    return PostMetricDetailModel(
      postId: json['postId'] is int ? json['postId'] : int.parse(json['postId'].toString()),
      platform: json['platform'] ?? '',
      text: json['text'] ?? '',
      views: json['views'] is int ? json['views'] : int.tryParse(json['views']?.toString() ?? '0') ?? 0,
      reactions: json['reactions'] is int ? json['reactions'] : int.tryParse(json['reactions']?.toString() ?? '0') ?? 0,
      clicks: json['clicks'] is int ? json['clicks'] : int.tryParse(json['clicks']?.toString() ?? '0') ?? 0,
    );
  }
}

class AnalyticsOverviewModel {
  final int totalPosts;
  final int publishedPosts;
  final int totalViews;
  final int totalReactions;
  final int totalClicks;
  final bool hasData;
  final String summaryMessage;
  final List<String> recommendations;
  final List<PostMetricDetailModel> topPosts;

  AnalyticsOverviewModel({
    required this.totalPosts,
    required this.publishedPosts,
    required this.totalViews,
    required this.totalReactions,
    required this.totalClicks,
    required this.hasData,
    required this.summaryMessage,
    required this.recommendations,
    required this.topPosts,
  });

  factory AnalyticsOverviewModel.fromJson(Map<String, dynamic> json) {
    List<String> recs = [];
    if (json['recommendations'] is List) {
      recs = (json['recommendations'] as List).map((e) => e.toString()).toList();
    }

    List<PostMetricDetailModel> posts = [];
    if (json['topPosts'] is List) {
      posts = (json['topPosts'] as List)
          .map((e) => PostMetricDetailModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    }

    return AnalyticsOverviewModel(
      totalPosts: json['totalPosts'] is int ? json['totalPosts'] : 0,
      publishedPosts: json['publishedPosts'] is int ? json['publishedPosts'] : 0,
      totalViews: json['totalViews'] is int ? json['totalViews'] : 0,
      totalReactions: json['totalReactions'] is int ? json['totalReactions'] : 0,
      totalClicks: json['totalClicks'] is int ? json['totalClicks'] : 0,
      hasData: json['hasData'] == true,
      summaryMessage: json['summaryMessage'] ?? '',
      recommendations: recs,
      topPosts: posts,
    );
  }
}
