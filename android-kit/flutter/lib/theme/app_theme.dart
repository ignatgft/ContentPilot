import 'package:flutter/material.dart';

class CpColors {
  const CpColors({required this.bg, required this.surface, required this.ink, required this.muted, required this.border, required this.accent, required this.onAccent, required this.chipBg, required this.chipText, required this.success, required this.warning, required this.accent2});
  final Color bg, surface, ink, muted, border, accent, onAccent, chipBg, chipText, success, warning, accent2;

  static const light = CpColors(bg: Color(0xFFF4F5FA), surface: Color(0xFFFFFFFF), ink: Color(0xFF14172B), muted: Color(0xFF4A4F68), border: Color(0xFFE2E4EF), accent: Color(0xFF4F46E5), onAccent: Color(0xFFFFFFFF), chipBg: Color(0xFFEEF0FF), chipText: Color(0xFF3730A3), success: Color(0xFF15803D), warning: Color(0xFFB45309), accent2: Color(0xFF06B6D4));
  static const dark = CpColors(bg: Color(0xFF0F1220), surface: Color(0xFF181C30), ink: Color(0xFFF2F3FA), muted: Color(0xFFA3A8C3), border: Color(0xFF2A2F4A), accent: Color(0xFF7C83FF), onAccent: Color(0xFF0F1220), chipBg: Color(0xFF232850), chipText: Color(0xFFC7CBFF), success: Color(0xFF4ADE80), warning: Color(0xFFFBBF24), accent2: Color(0xFF22D3EE));
}

ThemeData buildTheme(CpColors c, Brightness b) {
  final scheme = ColorScheme(brightness: b, primary: c.accent, onPrimary: c.onAccent, secondary: c.accent2, onSecondary: c.onAccent, error: c.warning, onError: c.onAccent, surface: c.surface, onSurface: c.ink);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.bg,
    fontFamily: 'Manrope',
    dividerColor: c.border,
    cardTheme: CardThemeData(color: c.surface, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: c.border))),
    filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), textStyle: const TextStyle(fontWeight: FontWeight.w800))),
    outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48), side: BorderSide(color: c.border), foregroundColor: c.ink, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)))),
    inputDecorationTheme: InputDecorationTheme(filled: true, fillColor: c.bg, border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: c.border))),
  );
}
