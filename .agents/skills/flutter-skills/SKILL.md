---
name: flutter-skills
description: Comprehensive Flutter development guide covering clean architecture, Riverpod state management, async safety, UI states/feedback, and mobile testing strategy.
---

# Flutter Skills Suite

This skill provides best practices, architectural blueprints, and code patterns for building robust, reactive, and maintainable Flutter applications.

## 1. Clean Architecture for Flutter
- **Feature-first organization**:
  ```
  lib/
  ├── core/               # Shared constants, theme, api client, errors
  │   ├── constants/
  │   ├── network/
  │   └── theme/
  └── features/
      └── [feature_name]/
          ├── data/       # Models, DTOs, data sources, repository implementations
          ├── domain/     # Entities, value objects, repository interfaces
          └── presentation/ # Widgets, screens, Riverpod providers/notifiers
  ```
- **Separation of Concerns**:
  - Presentation only handles UI rendering and user interactions.
  - Domain layer is pure Dart, decoupled from Flutter UI and third-party frameworks.
  - Data layer encapsulates API communication, caching, and storage.

## 2. State Management with Riverpod
- Use `AsyncNotifierProvider` / `NotifierProvider` for stateful feature logic.
- Avoid placing side-effects inside build methods.
- Provide strongly-typed state unions (`AsyncValue<T>`, `data`, `loading`, `error`):
  ```dart
  ref.watch(creativeStudioProvider).when(
    data: (state) => CreativeStudioContent(state: state),
    loading: () => const Center(child: CircularProgressIndicator()),
    error: (err, stack) => ErrorDisplay(error: err, onRetry: () => ref.refresh(creativeStudioProvider)),
  );
  ```
- Keep providers focused and testable. Use `ref.read` only in callbacks and `ref.watch` in build.

## 3. Async Safety & Lifecycle
- Always check `if (!mounted) return;` after `await` in `StatefulWidget` callbacks or use Riverpod Notifiers where state updates are bound to notifier lifecycle.
- Cancel active streams, timers, and controllers in `dispose()`.
- Guard against rapid double-taps using debounce or `isSubmitting` flags.
- Handle connectivity drops gracefully with retry mechanisms.

## 4. UI States and Feedback (UI/UX Pro Max standards)
- **Empty States**: Never show blank screens. Always provide illustrations/icons, clear explanation, and a primary CTA.
- **Skeleton Loaders / Shimmers**: Use subtle pulse animations instead of generic fullscreen spinners for lists and cards.
- **Micro-interactions**: Use `AnimatedContainer`, `AnimatedSwitcher`, or Haptic feedback (`HapticFeedback.lightImpact()`) on button presses.
- **Toasts & Snackbars**: Provide contextual floating snackbars for success and error messages with distinct colors and action buttons.

## 5. Testing & Verification Strategy
- **Unit Tests**: Test repositories, DTO mappers, and Notifiers in isolation with mocked `ApiClient`.
- **Widget Tests**: Test key UI screens using `ProviderScope(overrides: [...])` to verify states (loading, empty, success, error).
- **Integration & Build Verification**: Verify builds with `flutter analyze` and `flutter test`.
