class UserInfo {
  final int id;
  final String email;

  UserInfo({required this.id, required this.email});

  factory UserInfo.fromJson(Map<String, dynamic> json) {
    return UserInfo(
      id: json['id'] is int ? json['id'] : int.parse(json['id'].toString()),
      email: json['email'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'id': id, 'email': email};
}

class AuthResponse {
  final String token;
  final String? refreshToken;
  final UserInfo user;

  AuthResponse({
    required this.token,
    this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] ?? '',
      refreshToken: json['refreshToken'],
      user: UserInfo.fromJson(json['user'] ?? {}),
    );
  }
}
