class BrandModel {
  final int? id;
  final int? userId;
  final String name;
  final String? description;
  final String? audience;
  final String? tone;
  final Map<String, dynamic>? facts;
  final String autonomyMode;
  final List<String> samples;

  BrandModel({
    this.id,
    this.userId,
    required this.name,
    this.description,
    this.audience,
    this.tone,
    this.facts,
    this.autonomyMode = 'COPILOT',
    this.samples = const [],
  });

  factory BrandModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? parsedFacts;
    if (json['facts'] is Map) {
      parsedFacts = Map<String, dynamic>.from(json['facts']);
    }

    List<String> parsedSamples = [];
    if (json['samples'] is List) {
      parsedSamples = (json['samples'] as List).map((e) => e.toString()).toList();
    }

    return BrandModel(
      id: json['id'] != null ? (json['id'] is int ? json['id'] : int.tryParse(json['id'].toString())) : null,
      userId: json['userId'] != null ? (json['userId'] is int ? json['userId'] : int.tryParse(json['userId'].toString())) : null,
      name: json['name'] ?? '',
      description: json['description'],
      audience: json['audience'],
      tone: json['tone'],
      facts: parsedFacts,
      autonomyMode: json['autonomyMode'] ?? 'COPILOT',
      samples: parsedSamples,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      if (description != null) 'description': description,
      if (audience != null) 'audience': audience,
      if (tone != null) 'tone': tone,
      if (facts != null) 'facts': facts,
      'autonomyMode': autonomyMode,
      'samples': samples,
    };
  }

  BrandModel copyWith({
    int? id,
    int? userId,
    String? name,
    String? description,
    String? audience,
    String? tone,
    Map<String, dynamic>? facts,
    String? autonomyMode,
    List<String>? samples,
  }) {
    return BrandModel(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      description: description ?? this.description,
      audience: audience ?? this.audience,
      tone: tone ?? this.tone,
      facts: facts ?? this.facts,
      autonomyMode: autonomyMode ?? this.autonomyMode,
      samples: samples ?? this.samples,
    );
  }
}
