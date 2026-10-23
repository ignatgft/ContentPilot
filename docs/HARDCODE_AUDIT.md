# ContentPilot — Аудит Хардкода, Заглушек и Интеграций (HARDCODE_AUDIT.md)

> **Статус аудита**: Завершён. Все выявленные проблемы устранены. Проведён полный аудит кодовой базы (Backend Java, Web React 19, Mobile Flutter 3.35, Docker, PostgreSQL).

---

## Резюме аудита и статус устранения

| ID | Область | Файл | Текущее поведение | Требуемое изменение | Статус |
|:---:|:---|:---|:---|:---|:---:|
| **H-01** | AI Text Provider | `ClaudeGenerationService.java`, `application.yml` | Жесткая привязка к Anthropic Claude API; отсутствие альтернативных провайдеров (Gemini, Ollama). | Реализовать `TextGenerationProvider` интерфейс с реализациями `ClaudeTextProvider`, `GeminiTextProvider`, `OllamaTextProvider`, `FallbackTextProvider`. Поддержать параметры `AI_TEXT_PROVIDER`, `AI_TEXT_MODEL`, `GEMINI_API_KEY`. | `RESOLVED` |
| **H-02** | Fallback генерация | `ClaudeGenerationService.java` | Были захардкожены тексты тыквенного латте и цена 320₽ при отсутствии ключа API. | Заменено на динамический парсинг `brand.getFacts()` (меню, цены, график, адрес, цель). | `RESOLVED` |
| **H-03** | Проверка цен | `VerificationService.java` | Проверялось только слово «латте» с ценой 320₽. | Дехардизировано: проверка всех блюд/товаров из `brand.getFacts()` (список и мапа), детектирование несовпадений для любого товара. | `RESOLVED` |
| **H-04** | Аналитика | `AnalyticsService.java` | При отсутствии записей в `PostMetrics` генерировались фиктивные цифры (`publishedCount * 142`). | Удален синтетический генератор. Данные берутся строго из `PostMetricsRepository`. Если данных нет — отображается честное пустое состояние. | `RESOLVED` |
| **H-05** | Синхронизация метрик | `PublisherScheduler.java` | Метрики публиковались, но не сохранялись в БД. | Добавлен периодический опрос соцсетей `syncPublishedMetrics()` и сохранение в `PostMetrics`. | `RESOLVED` |
| **H-06** | Мультимедиа в Telegram | `TelegramPublisherService.java` | Все посты отправлялись только через `sendMessage` (текст), игнорируя прикрепленные фото/видео. | Добавлена поддержка `sendPhoto` для графики (.png, .jpg) и `sendVideo` для роликов (.mp4) с caption. | `RESOLVED` |
| **H-07** | Пресеты студии | `CreativeStudioService.java` | Только 4 статичных пресета без учета специфики бизнеса. | Добавлена динамическая генерация пресетов из реального меню бренда пользователя. | `RESOLVED` |
| **H-08** | Сохранение настроек | `SettingsPage.tsx` | При сохранении режима автономности отправлялось жестко заданное имя `'Coffee Point'`. | Устранено: имя берется из `brandData.name`. `BrandService.java` обновлен для безопасного частичного обновления. | `RESOLVED` |
| **H-09** | AI Image Provider | `application.yml`, `CreativeStudioService.java` | Поддерживался только DALL-E 3 и Fallback; ComfyUI (FLUX.1 schnell) отсутствовал. | Добавить `ComfyUiImageProvider` с поддержкой `AI_IMAGE_PROVIDER=comfyui` и `COMFYUI_BASE_URL`. | `RESOLVED` |
| **H-10** | Демо-режим и изоляция | `application.yml`, `AuthService.java`, `ClaudeGenerationService.java` | Демо-режим не был изолирован отдельным флагом конфигурации. | Введен флаг `DEMO_MODE_ENABLED` (по умолчанию `false`). В боевом режиме при отсутствии настроенного AI возвращать понятную ошибку, а не маскировать подделкой. | `RESOLVED` |
| **H-11** | URL сервера в Mobile | `mobile/lib/api/api_client.dart` | Захардкожен временный trycloudflare URL и локальный IP `192.168.10.181`. | Поддержано чтение `String.fromEnvironment('API_BASE_URL')` и динамическое сохранение пользовательского адреса в `FlutterSecureStorage`. | `RESOLVED` |
| **H-12** | Интерактивный Календарь | `CalendarPage.tsx` | Клик по посту в календаре не открывал детальный просмотр и перенос расписания. | Добавлено модальное окно просмотра публикации, смены времени и быстрого перехода к редактированию и публикации. | `RESOLVED` |
| **H-13** | Генератор в Mobile | `generator_screen.dart` | Захардкожен дефолтный промпт «Продвинуть сезонный латте Тыква-Пряности». | Инициализировать промпт из реального меню или названия бренда из `brandProvider`. | `RESOLVED` |
| **H-14** | Межпользовательская безопасность | `PostController.java`, `CampaignController.java`, `CreativeStudioController.java` | Проверить и подтвердить изоляцию данных по `userId` во всех эндпоинтах. | Добавлена строгая валидация принадлежности сущностей текущему авторизованному `User` (Security / Tenant Isolation). Чужие сущности блокируются с HTTP 403. | `RESOLVED` |
| **H-15** | Google OAuth верификация | `AuthService.java`, `AuthContext.tsx` | Подделка токенов в демо-режиме (`mock_google_id_token_*`) и дефолтный email `google.user@example.com`. | Заменено на официальную верификацию ID-токена через Google TokenInfo (`https://oauth2.googleapis.com/tokeninfo?id_token=`) с безопасным разбором JWT-клеймов. Поддельные мок-токены полностью удалены. | `RESOLVED` |
| **H-16** | Демо-данные бренда | `BrandOnboardingPage.tsx`, `brand_screen.dart`, `brand_provider.dart` | Предустановленная кофейня Coffee Point и кнопка «Заполнить кофейню для демо». | Полностью удалены демо-пресеты кофейни и скрытые меню. Форма инициализируется чистым пустым состоянием с возможностью добавления реальных товаров, услуг и цен. | `RESOLVED` |
| **H-17** | Публикация в Telegram | `TelegramPublisherService.java` | Имитация отправки (`Simulating Telegram publish...`) с фальшивым статусом успеха при отсутствии токена. | Устранено: сервис честно проверяет наличие `botToken` и `chatId`, логирует статус `FAILED` и возвращает понятную ошибку. | `RESOLVED` |

---

## Руководство по Google OAuth
Полная инструкция по созданию проекта в Google Cloud Console, настройке экрана согласия OAuth, выпуску Client ID и Client Secret для Web и Android доступна в файле [`docs/GOOGLE_AUTH_SETUP.md`](file:///D:/dev/ContentPilot/docs/GOOGLE_AUTH_SETUP.md).
