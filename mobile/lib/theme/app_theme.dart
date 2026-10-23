import 'package:flutter/material.dart';

class CpColors {
  const CpColors({
    required this.bg,
    required this.surface,
    required this.surfaceVariant,
    required this.ink,
    required this.muted,
    required this.border,
    required this.accent,
    required this.onAccent,
    required this.chipBg,
    required this.chipText,
    required this.success,
    required this.warning,
    required this.danger,
    required this.accent2,
  });

  final Color bg, surface, surfaceVariant, ink, muted, border, accent, onAccent, chipBg, chipText, success, warning, danger, accent2;

  static const light = CpColors(
    bg: Color(0xFFF6F8FC),
    surface: Color(0xFFFFFFFF),
    surfaceVariant: Color(0xFFF0F3F9),
    ink: Color(0xFF0F172A),
    muted: Color(0xFF64748B),
    border: Color(0xFFE2E8F0),
    accent: Color(0xFF4F46E5),
    onAccent: Color(0xFFFFFFFF),
    chipBg: Color(0xFFEEF2FF),
    chipText: Color(0xFF4338CA),
    success: Color(0xFF10B981),
    warning: Color(0xFFF59E0B),
    danger: Color(0xFFEF4444),
    accent2: Color(0xFF06B6D4),
  );

  static const dark = CpColors(
    bg: Color(0xFF0B0F19),
    surface: Color(0xFF131B2E),
    surfaceVariant: Color(0xFF1A233D),
    ink: Color(0xFFF8FAFC),
    muted: Color(0xFF94A3B8),
    border: Color(0xFF232F4D),
    accent: Color(0xFF6366F1),
    onAccent: Color(0xFFFFFFFF),
    chipBg: Color(0xFF1E2648),
    chipText: Color(0xFFA5B4FC),
    success: Color(0xFF34D399),
    warning: Color(0xFFFBBF24),
    danger: Color(0xFFF87171),
    accent2: Color(0xFF22D3EE),
  );

  // Pro Max Gradients
  static const primaryGradient = LinearGradient(
    colors: [Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFF06B6D4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const aiGlowGradient = LinearGradient(
    colors: [Color(0xFF6366F1), Color(0xFF8B5CF6), Color(0xFFEC4899)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const sunsetGradient = LinearGradient(
    colors: [Color(0xFFF97316), Color(0xFFEC4899), Color(0xFF8B5CF6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const darkCardGradient = LinearGradient(
    colors: [Color(0xFF161F36), Color(0xFF111728)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

ThemeData buildTheme(CpColors c, Brightness b) {
  final scheme = ColorScheme(
    brightness: b,
    primary: c.accent,
    onPrimary: c.onAccent,
    secondary: c.accent2,
    onSecondary: c.onAccent,
    error: c.danger,
    onError: c.onAccent,
    surface: c.surface,
    onSurface: c.ink,
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.bg,
    fontFamily: 'Manrope',
    dividerColor: c.border,
    appBarTheme: AppBarTheme(
      backgroundColor: c.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'Manrope',
        fontSize: 18,
        fontWeight: FontWeight.w800,
        color: c.ink,
      ),
      iconTheme: IconThemeData(color: c.ink),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: c.surface,
      elevation: 3,
      shadowColor: c.ink.withOpacity(0.06),
      indicatorColor: c.accent.withOpacity(0.12),
      labelTextStyle: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: c.accent,
          );
        }
        return TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: c.muted,
        );
      }),
      iconTheme: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return IconThemeData(color: c.accent, size: 24);
        }
        return IconThemeData(color: c.muted, size: 24);
      }),
    ),
    cardTheme: CardThemeData(
      color: c.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: c.border.withOpacity(0.8), width: 1),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(
          fontFamily: 'Manrope',
          fontWeight: FontWeight.w700,
          fontSize: 15,
        ),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        side: BorderSide(color: c.border, width: 1.2),
        foregroundColor: c.ink,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(
          fontFamily: 'Manrope',
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: b == Brightness.dark ? const Color(0xFF111728) : const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: c.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: c.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: c.accent, width: 2),
      ),
      hintStyle: TextStyle(color: c.muted.withOpacity(0.7), fontSize: 14),
    ),
  );
}

/// UI UX Pro Max: Универсальная карточка с мягкой тенью и стеклянным эффектом
class CpCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? color;
  final Gradient? gradient;
  final VoidCallback? onTap;
  final Border? border;
  final double borderRadius;

  const CpCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.margin,
    this.color,
    this.gradient,
    this.onTap,
    this.border,
    this.borderRadius = 20,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final colors = isDark ? CpColors.dark : CpColors.light;

    final boxDecoration = BoxDecoration(
      color: gradient == null ? (color ?? colors.surface) : null,
      gradient: gradient,
      borderRadius: BorderRadius.circular(borderRadius),
      border: border ?? Border.all(color: colors.border.withOpacity(isDark ? 0.6 : 0.8), width: 1),
      boxShadow: [
        BoxShadow(
          color: isDark ? Colors.black.withOpacity(0.3) : colors.ink.withOpacity(0.04),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
      ],
    );

    Widget content = Container(
      margin: margin,
      decoration: boxDecoration,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Padding(
          padding: padding ?? EdgeInsets.zero,
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(borderRadius),
          onTap: onTap,
          child: content,
        ),
      );
    }
    return content;
  }
}

/// UI UX Pro Max: Статусный бейдж со световым индикатором
class CpStatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;

  const CpStatusBadge({super.key, required this.status, this.fontSize = 12});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color text;
    Color dot;
    String label;

    switch (status.toUpperCase()) {
      case 'PUBLISHED':
        bg = const Color(0xFF10B981).withOpacity(0.12);
        text = const Color(0xFF059669);
        dot = const Color(0xFF10B981);
        label = 'Опубликовано';
        break;
      case 'SCHEDULED':
        bg = const Color(0xFF6366F1).withOpacity(0.12);
        text = const Color(0xFF4F46E5);
        dot = const Color(0xFF6366F1);
        label = 'Запланировано';
        break;
      case 'NEEDS_REVIEW':
        bg = const Color(0xFFF59E0B).withOpacity(0.12);
        text = const Color(0xFFD97706);
        dot = const Color(0xFFF59E0B);
        label = 'На проверке';
        break;
      case 'PAUSED':
        bg = const Color(0xFFEF4444).withOpacity(0.12);
        text = const Color(0xFFDC2626);
        dot = const Color(0xFFEF4444);
        label = 'Приостановлено';
        break;
      case 'DRAFT':
      default:
        bg = const Color(0xFF64748B).withOpacity(0.12);
        text = const Color(0xFF475569);
        dot = const Color(0xFF94A3B8);
        label = 'Черновик';
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: dot.withOpacity(0.3), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              color: dot,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(color: dot.withOpacity(0.6), blurRadius: 4, spreadRadius: 1),
              ],
            ),
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: text,
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

/// UI UX Pro Max: Кнопка с градиентом
class CpGradientButton extends StatelessWidget {
  final String text;
  final IconData? icon;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Gradient? gradient;

  const CpGradientButton({
    super.key,
    required this.text,
    this.icon,
    this.onPressed,
    this.isLoading = false,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: onPressed == null ? null : (gradient ?? CpColors.primaryGradient),
        color: onPressed == null ? Colors.grey.withOpacity(0.3) : null,
        borderRadius: BorderRadius.circular(14),
        boxShadow: onPressed == null
            ? null
            : [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withOpacity(0.35),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: isLoading ? null : onPressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
            child: Center(
              child: isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (icon != null) ...[
                          Icon(icon, color: Colors.white, size: 19),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          text,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.2,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
