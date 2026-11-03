import 'package:flutter/material.dart';

class CanteenColors {
  // Apple × JetBrains Premium Graphite Palette
  static const Color primary = Color(0xFF5B8CFF); // Apple/JetBrains Electric Blue
  static const Color primaryDark = Color(0xFF4577EB);
  static const Color primaryLight = Color(0xFF82A8FF);
  static const Color accent = Color(0xFF9477FF); // Violet
  static const Color cyan = Color(0xFF55C7DE); // Cyan 0-PII
  static const Color amber = Color(0xFFFFB547); // Warning / FEFO
  static const Color red = Color(0xFFFF647C); // Error / Allergens
  static const Color green = Color(0xFF39C98A); // Success / SanPiN / Served

  // Light theme colors (Crisp Minimal)
  static const Color lightBg = Color(0xFFF5F7FA);
  static const Color lightSurface = Colors.white;
  static const Color lightBorder = Color(0xFFE2E8F0);
  static const Color lightText = Color(0xFF111827);
  static const Color lightTextMuted = Color(0xFF6B7280);

  // Dark theme colors (Premium Graphite)
  static const Color darkBg = Color(0xFF111318);
  static const Color darkSurface = Color(0xFF1D222C);
  static const Color darkSurfaceElevated = Color(0xFF242A35);
  static const Color darkBorder = Color(0xFF303744);
  static const Color darkText = Color(0xFFF5F7FA);
  static const Color darkTextMuted = Color(0xFFA6AFBC);
  static const Color darkTextCaption = Color(0xFF7F8998);
}

class CanteenTheme {
  static ThemeData light() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: CanteenColors.lightBg,
      primaryColor: CanteenColors.primary,
      colorScheme: const ColorScheme.light(
        primary: CanteenColors.primary,
        secondary: CanteenColors.accent,
        surface: CanteenColors.lightSurface,
        error: CanteenColors.red,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: CanteenColors.lightSurface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: CanteenColors.lightText,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.2,
        ),
        iconTheme: IconThemeData(color: CanteenColors.lightText),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: CanteenColors.lightSurface,
        selectedItemColor: CanteenColors.primary,
        unselectedItemColor: CanteenColors.lightTextMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }

  static ThemeData dark() {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: CanteenColors.darkBg,
      primaryColor: CanteenColors.primary,
      colorScheme: const ColorScheme.dark(
        primary: CanteenColors.primary,
        secondary: CanteenColors.accent,
        surface: CanteenColors.darkSurface,
        error: CanteenColors.red,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: CanteenColors.darkSurface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: CanteenColors.darkText,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.2,
        ),
        iconTheme: IconThemeData(color: CanteenColors.darkText),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: CanteenColors.darkSurface,
        selectedItemColor: CanteenColors.primary,
        unselectedItemColor: CanteenColors.darkTextCaption,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
    );
  }
}
