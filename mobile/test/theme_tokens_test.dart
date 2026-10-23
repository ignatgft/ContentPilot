import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:contentpilot_mobile/theme/app_theme.dart';

void main() {
  group('UI UX Pro Max Theme Tokens Tests', () {
    test('Dark and Light palettes have distinct background and ink colors', () {
      expect(CpColors.dark.bg, isNot(equals(CpColors.light.bg)));
      expect(CpColors.dark.ink, isNot(equals(CpColors.light.ink)));

      // Assert Dark theme is luxury dark (< 0x20 in RGB channels)
      expect(CpColors.dark.bg.red, lessThan(30));
      expect(CpColors.dark.bg.green, lessThan(30));
      expect(CpColors.dark.bg.blue, lessThan(30));

      // Assert Light theme is clean modern light (> 0xF0)
      expect(CpColors.light.bg.red, greaterThan(240));
      expect(CpColors.light.bg.green, greaterThan(240));
      expect(CpColors.light.bg.blue, greaterThan(240));
    });

    test('Primary gradient has 3 rich color stops', () {
      expect(CpColors.primaryGradient.colors.length, equals(3));
    });
  });
}
