# ContentPilot — Статус Реализации и Дорожная Карта

> Документ обновлён по результатам полного аудита, дехардизации, настройки Google OAuth, очистки демо-данных и прохождения всех интеграционных тестов.

---

## Прогресс по фазам

| Фаза | Описание | Статус | Прогресс |
|:---:|:---|:---:|:---:|
| **Этап A** | **Полный аудит проекта и создание `docs/HARDCODE_AUDIT.md`** | `COMPLETED` | 100% |
| **Этап B** | **Backend: Конфигурация, безопасность, изоляция арендаторов, `DEMO_MODE_ENABLED`** | `COMPLETED` | 100% |
| **Этап C** | **AI-Слой: Конфигурируемые провайдеры текста (Gemini / Claude / Ollama) и изображений (ComfyUI / OpenAI / Fallback)** | `COMPLETED` | 100% |
| **Этап D** | **Web Frontend: Интерактивный календарь (перенос дат, прямой пуш, просмотр медиа), дехардизация целей** | `COMPLETED` | 100% |
| **Этап E** | **Flutter Mobile: Конфигурируемый API URL (`API_BASE_URL` + secure storage), динамический генератор, сессии** | `COMPLETED` | 100% |
| **Этап F** | **Медиа и Видео: FFmpeg-обработка (Reels 9:16, Ken Burns zoom), оверлеи цен, асинхронный поллинг** | `COMPLETED` | 100% |
| **Этап G** | **Сквозное тестирование: Backend Maven (7/7), Web TS Build (0 errors), Flutter Test (6/6), Live MVP Suite (14/14)** | `COMPLETED` | 100% |
| **Этап H** | **Google OAuth & Очистка демо-данных: Инструкция Google Cloud, удаление мок-токенов и дефолтных кофеен** | `COMPLETED` | 100% |

---

## Журнал изменений и верификации

### Этап A (Аудит)
- [x] Проверены реальные ветки Git и статус рабочего дерева (`main`).
- [x] Изучены контракты моделей, сущностей, DTO и Flyway-миграций.
- [x] Составлен реестр устранённого хардкода в [`docs/HARDCODE_AUDIT.md`](docs/HARDCODE_AUDIT.md).

### Этап B (Backend & Security)
- [x] Внедрена изоляция арендаторов (проверка прав доступа текущего `userId` к кампаниям, постам и задачам Creative Studio). Чужие сущности блокируются с HTTP 403.
- [x] Введен флаг `DEMO_MODE_ENABLED` (по умолчанию `false` для боевого запуска). При отсутствии настроенных ключей в боевом режиме возвращается понятная ошибка.
- [x] Дехардизирована аналитика: расчет строго по `PostMetricsRepository` без синтетических коэффициентов.
- [x] Дехардизирован фактчекинг: проверка всех товаров меню в `VerificationService`.
- [x] Обновлен `.env.example` и `docker-compose.yml` со всеми новыми переменными окружения.

### Этап C (AI Провайдеры)
- [x] Создан интерфейс `TextGenerationProvider`.
- [x] Реализованы `GeminiTextProvider` (Google Gemini API — `gemini-2.5-flash`), `ClaudeTextProvider` (Anthropic API), `OllamaTextProvider` (локальный сервер) и `FallbackTextProvider` (Brand Memory).
- [x] Создан `ComfyUiImageProvider` для генерации через FLUX.1 schnell / SDXL по `COMFYUI_BASE_URL`.
- [x] Настроен гибкий роутинг по переменным `AI_TEXT_PROVIDER`, `AI_TEXT_MODEL`, `GEMINI_API_KEY`, `COMFYUI_BASE_URL`, `OPENAI_API_KEY`.

### Этап D (Web Frontend)
- [x] В `CalendarPage.tsx` добавлено модальное окно деталей публикации, перенос времени выхода (`PUT /posts/{id}`) и мгновенная отправка (`POST /posts/{id}/publish`).
- [x] Дехардизированы цели кампании в `CampaignGoalPage.tsx` под реальное меню бренда.
- [x] Дехардизировано имя бренда в `SettingsPage.tsx`.

### Этап E (Flutter Mobile)
- [x] `ApiClient` расширен поддержкой `API_BASE_URL` из окружения сборки и сохранением кастомного URL в `FlutterSecureStorage`.
- [x] `GeneratorScreen` инициализирует маркетинговый промпт из реальных блюд/товаров памяти бренда.
- [x] AI Creative Studio подставляет цены и пресеты из базы данных бренда.

### Этап F (Видео и FFmpeg)
- [x] Асинхронный воркфлоу вертикальных Reels/Shorts (1080x1920) с эффектом Ken Burns zoom и флагом `+faststart`.
- [x] Векторный оверлей цен `CreativeOverlayRenderer` (0% галлюцинаций стоимости).

### Этап G (Тестирование)
- [x] Maven JUnit 5 тесты: **7/7 passed**.
- [x] Web TypeScript: **0 errors**, build 640ms.
- [x] Flutter тесты: **6/6 passed**, 0 failures.
- [x] Сквозной интеграционный Live MVP тест: **14/14 шагов passed**.

### Этап H (Google OAuth & Очистка демо-данных)
- [x] Создано подробное пошаговое руководство [`docs/GOOGLE_AUTH_SETUP.md`](docs/GOOGLE_AUTH_SETUP.md) по настройке Google Cloud Console, экрана согласия OAuth, scopes, Client ID / Secret для Web и Android SHA-1.
- [x] Удалены мок-токены `mock_google_id_token_*` из `AuthContext.tsx`. Реализована верификация через официальный Google TokenInfo эндпоинт (`https://oauth2.googleapis.com/tokeninfo?id_token=`).
- [x] Удалена симуляция публикации `Simulating Telegram publish...` из `TelegramPublisherService.java`.
- [x] Из веб-страницы `BrandOnboardingPage.tsx` удален демо-пресет кофейни Coffee Point и кнопка «Заполнить кофейню для демо». Добавлено полноценное управление списком товаров, услуг и цен с возможностью динамического добавления и удаления.
- [x] Из мобильного приложения (`brand_screen.dart`, `brand_provider.dart`) удалены захардкоженные блюда тыквенного латте, пресеты и демо-карточки. Реализован динамический ввод наименований и цен.
