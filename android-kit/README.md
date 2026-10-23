# ContentPilot: Android-кит

Платформа: Android (Flutter). Иконок: 48.

## Куда класть
- `android/app/src/main/res/` -> в `/mobile/android/app/src/main/res/` (адаптивная иконка с монохромным слоем для тем Android 13+, иконка уведомлений `ic_stat_contentpilot`, цвета, векторные иконки `ic_*.xml`).
- `android/app/src/debug/` -> в `/mobile/android/app/src/debug/` (только debug: разрешает http к локальному бэкенду. В release использовать https).
- `flutter/assets/` -> в `/mobile/assets/` и объявить в `pubspec.yaml`: `assets: [assets/icons/, assets/logo/, assets/avatars/, assets/platforms/, assets/banners/, assets/splash/, assets/tokens.json]`.
- `flutter/lib/theme/` -> в `/mobile/lib/theme/` (`app_theme.dart`: светлая и тёмная тема из токенов, `app_icons.dart`: константы и виджет `AppIcon`).
- `flutter_launcher_icons.yaml` и `flutter_native_splash.yaml` -> в корень `/mobile/`, запуск: `dart run flutter_launcher_icons` и `dart run flutter_native_splash:create`.
- `store/`: иконка Google Play 512x512 и графика функции 1024x500.

## Зависимости
`flutter_svg`, `flutter_secure_storage`, `dio`, `go_router`, `flutter_riverpod`, `google_sign_in`, `flutter_local_notifications`, dev: `flutter_launcher_icons`, `flutter_native_splash`.

## Шрифт
Manrope (400, 500, 700, 800): скачать с Google Fonts и положить в `assets/fonts/`, объявить в `pubspec.yaml`. В кит не включён.

## Манифест
Разрешения: `INTERNET`, `POST_NOTIFICATIONS` (Android 13+). Иконка уведомлений: `@drawable/ic_stat_contentpilot`.

## Google-вход
В Google Cloud создать Android OAuth client: нужны имя пакета и SHA-1 отпечаток ключа подписи (отдельно для debug и release).

## Ограничения
Значки площадок временные (буквенные). Эмулятор обращается к хосту по `10.0.2.2`.
