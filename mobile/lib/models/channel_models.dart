class ChannelModel {
  final int id;
  final String platform;
  final String externalId;
  final String status;

  ChannelModel({
    required this.id,
    required this.platform,
    required this.externalId,
    required this.status,
  });

  factory ChannelModel.fromJson(Map<String, dynamic> json) {
    return ChannelModel(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      platform: json['platform'] ?? '',
      externalId: json['externalId'] ?? '',
      status: json['status'] ?? 'CONNECTED',
    );
  }
}

class PublisherCapabilityModel {
  final String platform;
  final String displayName;
  final int maxTextLength;
  final List<String> supportedMediaTypes;
  final bool requiresPublicMediaUrl;
  final bool requiresAppAudit;
  final bool livePublishSupported;
  final String? auditNotice;

  PublisherCapabilityModel({
    required this.platform,
    required this.displayName,
    required this.maxTextLength,
    required this.supportedMediaTypes,
    required this.requiresPublicMediaUrl,
    required this.requiresAppAudit,
    required this.livePublishSupported,
    this.auditNotice,
  });

  factory PublisherCapabilityModel.fromJson(Map<String, dynamic> json) {
    List<String> mediaTypes = [];
    if (json['supportedMediaTypes'] is List) {
      mediaTypes = (json['supportedMediaTypes'] as List).map((e) => e.toString()).toList();
    }

    return PublisherCapabilityModel(
      platform: json['platform'] ?? '',
      displayName: json['displayName'] ?? '',
      maxTextLength: json['maxTextLength'] is int ? json['maxTextLength'] : 2000,
      supportedMediaTypes: mediaTypes,
      requiresPublicMediaUrl: json['requiresPublicMediaUrl'] == true,
      requiresAppAudit: json['requiresAppAudit'] == true,
      livePublishSupported: json['livePublishSupported'] == true,
      auditNotice: json['auditNotice'],
    );
  }
}
