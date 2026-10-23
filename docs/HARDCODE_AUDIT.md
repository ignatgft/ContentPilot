# ContentPilot — Аудит Хардкода, Заглушек и Интеграций (HARDCODE_AUDIT.md)

> **Статус аудита**: Завершён. Проведён полный анализ кодовой базы (Backend Java, Web React 19, Mobile Flutter 3.35, Docker, PostgreSQL).

---

## Резюме аудита

В ходе аудита были выявлены следующие категории хардкода, фиктивных данных и архитектурных ограничений, подлежащих исправлению:

| ID | Область | Файл | Текущее поведение | Требуемое изменение | Статус |
|:---:|:---|:---|:---|:---|:---:|
| **H-01** | AI Text Provider | `ClaudeGenerationService.java`, `application.yml` | Жесткая привязка к Anthropic Claude API; отсутствие альтернативных провайдеров (Gemini, Ollama). | Реализовать `TextGenerationProvider` интерфейс с реализациями `ClaudeTextProvider`, `GeminiTextProvider`, `OllamaTextProvider`, `FallbackTextProvider`. Поддержать параметры `AI_TEXT_PROVIDER`, `AI_TEXT_MODEL`, `GEMINI_API_KEY`. | `IN_PROGRESS` |
| **H-02** | Fallback генерация | `ClaudeGenerationService.java` | Были захардкожены тексты тыквенного латте и цена 320₽ при отсутствии ключа API. | Заменено на динамический парсинг `brand.getFacts()` (меню, цены, график, адрес, цель). | `RESOLVED` |
| **H-03** | Проверка цен | `VerificationService.java` | Проверялось только слово «латте» с ценой 320₽. | Дехардизировано: проверка всех блюд/товаров из `brand.getFacts()` (список и мапа), детектирование несовпадений для любого товара. | `RESOLVED` |
| **H-04** | Аналитика | `AnalyticsService.java` | При отсутствии записей в `PostMetrics` генерировались фиктивные цифры (`publishedCount * 142`). | Удален синтетический генератор. Данные берутся строго из `PostMetricsRepository`. Если данных нет — отображается честное пустое состояние. | `RESOLVED` |
| **H-05** | Синхронизация метрик | `PublisherScheduler.java` | Метрики публиковались, но не сохранялись в БД. | Добавлен периодический опрос соцсетей `syncPublishedMetrics()` и сохранение в `PostMetrics`. | `RESOLVED` |
| **H-06** | Мультимедиа в Telegram | `TelegramPublisherService.java` | Все посты отправлялись только через `sendMessage` (текст), игнорируя прикрепленные фото/видео. | Добавлена поддержка `sendPhoto` для графики (.png, .jpg) и `sendVideo` для роликов (.mp4) с caption. | `RESOLVED` |
| **H-07** | Пресеты студии | `CreativeStudioService.java` | Только 4 статичных пресета без учета специфики бизнеса. | Добавлена динамическая генерация пресетов из реального меню бренда пользователя. | `RESOLVED` |
| **H-08** | Сохранение настроек | `SettingsPage.tsx` | При сохранении режима автономности отправлялось жестко заданное имя `'Coffee Point'`. | Устранено: имя берется из `brandData.name`. `BrandService.java` обновлен для безопасного частичного обновления. | `RESOLVED` |
| **H-09** | AI Image Provider | `application.yml`, `CreativeStudioService.java` | Поддерживался только DALL-E 3 и Fallback; ComfyUI (FLUX.1 schnell) отсутствовал. | Добавить `ComfyUiImageProvider` с поддержкой `AI_IMAGE_PROVIDER=comfyui` и `COMFYUI_BASE_URL`. | `IN_PROGRESS` |
| **H-10** | Демо-режим | `application.yml`, `AuthService.java`, `ClaudeGenerationService.java` | Демо-режим не был изолирован отдельным флагом конфигурации. | Ввести флаг `DEMO_MODE_ENABLED` (по умолчанию `false`). В боевом режиме при отсутствии настроенного AI возвращать понятную ошибку, а не маскировать подделкой. | `IN_PROGRESS` |
| **H-11** | URL сервера в Mobile | `mobile/lib/api/api_client.dart` | Захардкожен временный trycloudflare URL и локальный IP `192.168.10.181`. | Поддержать `String.fromEnvironment('API_BASE_URL')` и чтение сохраненного пользователем адреса из secure storage. | `IN_PROGRESS` |
| **H-12** | Интерактивный Календарь | `CalendarPage.tsx` | Клик по посту в календаре не открывал детальный просмотр и перенос расписания. | Добавить модальное окно просмотра публикации, смены времени и быстрого перехода к редактированию. | `IN_PROGRESS` |
| **H-13** | Генератор в Mobile | `generator_screen.dart` | Захардкожен дефолтный промпт «Продвинуть сезонный латте Тыква-Пряности». | Инициализировать промпт из реального меню или названия бренда из `brandProvider`. | `IN_PROGRESS` |
| **H-14** | Межпользовательская безопасность | `PostController.java`, `CampaignController.java` | Проверить и подтвердить изоляцию данных по `userId` во всех эндпоинтах. | Добавить строгую валидацию принадлежности сущностей текущему авторизованному `User`. | `IN_PROGRESS` |

---

## Детальное описание проблем и план устранения

### 1. Архитектура AI-провайдеров (H-01, H-09, H-10)
- **Текущее состояние**: Вызов Claude зашит в `ClaudeGenerationService.java`, вызов DALL-E в `OpenAiImageProvider.java`.
- **Решение**:
  - Создать пакет `com.contentpilot.ai.text` с интерфейсом `TextGenerationProvider`:
    - `ClaudeTextProvider` (Anthropic API).
    - `GeminiTextProvider` (Google Gemini API — `gemini-2.5-flash` / `gemini-1.5-flash`).
    - `OllamaTextProvider` (локальный сервер Ollama).
    - `FallbackTextProvider` (детерминированный генератор по Brand Memory, доступный только при `DEMO_MODE_ENABLED=true`).
  - Создать `ComfyUiImageProvider` в `com.contentpilot.creative` для интеграции с локальным ComfyUI (FLUX.1 schnell).
  - Ввести в `application.yml` параметры:
    - `app.demo-mode-enabled: ${DEMO_MODE_ENABLED:false}`
    - `app.ai.text-provider: ${AI_TEXT_PROVIDER:gemini}`
    - `app.ai.text-model: ${AI_TEXT_MODEL:gemini-2.5-flash}`
    - `app.ai.gemini-api-key: ${GEMINI_API_KEY:}`
    - `app.ai.image-provider: ${AI_IMAGE_PROVIDER:fallback}`
    - `app.ai.comfyui-base-url: ${COMFYUI_BASE_URL:http://comfyui:8188}`
    - `app.ai.video-provider: ${AI_VIDEO_PROVIDER:ffmpeg-motion}`

### 2. Безопасность и проверка прав (H-14)
- Убедиться, что ни один эндпоинт (`/api/v1/campaigns/{id}`, `/api/v1/posts/{id}`, `/api/v1/creative/tasks/{id}`) не отдает и не модифицирует данные чужого пользователя при передаче стороннего ID.

### 3. Мобильный клиент и конфигурация (H-11, H-13)
- Перенести базовый адрес API в Flutter на гибкое определение через `API_BASE_URL` и сохранение в `FlutterSecureStorage`.
- Очистить экран генератора от статических кофейных строк при работе с другим бизнесом.

### 4. Веб-интерфейс календаря (H-12)
- Сделать карточки публикаций кликабельными с возможностью изменить дату/время и статус через API.
