# ContentPilot 2.0 — Полная документация реализации платформы

> **Статус**: Все 4 этапа проекта полностью реализованы и развёрнуты (Web React, Flutter Android Mobile, Spring Boot 3.3.4, PostgreSQL 16, Docker Compose, Cloudflare Quick Tunnel).

---

## 1. Обзор архитектуры и стек технологий

ContentPilot — это AI-платформа для полной автоматизации контент-маркетинга малого бизнеса (кофейни, рестораны, локальный ритейл, услуги).

### Стек:
- **Backend**: Spring Boot 3.3.4 (Java 21), Spring Data JPA, Spring Security, JWT (JJWT 0.12.6), Flyway, PostgreSQL 16, FFmpeg, ImageIO / Java2D.
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, Lucide Icons, Modern SaaS / UI UX Pro Max Tokens (Светлая и тёмная темы).
- **Mobile**: Flutter 3.35, Dart, Riverpod 2.6, Dio, Flutter Secure Storage, Material 3, кастомная дизайн-система `CpColors` (Dark Luxury & Light Pro Max), векторные SVG-ассеты.
- **Инфраструктура**: Docker Compose, Cloudflare Quick Tunnel, Nginx Reverse Proxy.

---

## 2. Реализованные страницы Web-платформы (`frontend/`)

| Маршрут | Название страницы | Описание и назначение | Почему так реализовано |
|---|---|---|---|
| `/` | **Кампании & Главная (`CampaignGoalPage.tsx`)** | Постановка маркетинговой цели (срок от 3 до 14 дней, бюджет, выбор каналов), карточки активных кампаний, кнопка быстрой генерации. | Основная точка входа предпринимателя. Позволяет за 1 клик запустить ИИ-генерацию постов на основе памяти бренда. |
| `/campaigns/:id` | **Детали кампании (`CampaignDetailsPage.tsx`)** | Сетка сгенерированных постов по дням и каналам, статусы верификации (`VerificationService`), редактирование текста, ручное подтверждение постов `NEEDS_REVIEW`. | Даёт прозрачный контроль над каждым постом перед отправкой в соцсети, защищая репутацию бизнеса. |
| `/calendar` | **Интерактивный календарь (`CalendarPage.tsx`)** | Таймлайн расписания публикаций, фильтрация по статусам (`SCHEDULED`, `PUBLISHED`, `NEEDS_REVIEW`, `PAUSED`), перенос даты и времени. | Наглядный календарный план контента для планирования маркетинговых акций. |
| `/creative` | **AI Creative Studio (`CreativeStudioPage.tsx`)** | **Этап 4**: Генерация промо-фото, карточек меню, баннеров и коротких роликов (Reels/Shorts 9:16). Вкладки «Фото», «Reels & Видео», «Медиатека». Пресеты, выбор стилей, детерминированный оверлей цен (без ошибок нейросети), прикрепление к постам. | Решает главную проблему малого бизнеса — отсутствие дизайнеров и качественного визуального контента. |
| `/brand` | **Профиль бренда (`BrandOnboardingPage.tsx`)** | Настройка тональности, целевой аудитории, адресов, часов работы, загрузка референсных постов и управление меню/ценами (Brand Memory). | Служит единым источником правды для Claude, исключая галлюцинации фактов о компании. |
| `/channels` | **Каналы и соцсети (`ChannelsPage.tsx`)** | Подключение и управление аккаунтами: Telegram (бот и канал), ВКонтакте, Instagram, TikTok, YouTube. Проверка прав, статусов подключения и capabilities. | Позволяет публиковать контент одновременно во все каналы из единого интерфейса. |
| `/analytics` | **Аналитика (`AnalyticsPage.tsx`)** | Метрики охватов, реакций, кликов, конверсий, графики вовлеченности по соцсетям и постам. | Бизнес видит реальную отдачу от каждого опубликованного поста и рубля. |
| `/settings` | **Настройки (`SettingsPage.tsx`)** | Управление учетной записью, автономией ИИ (Copilot / Full Auto), API-ключами и безопасностью. | Гибкая настройка степени свободы искусственного интеллекта. |

---

## 3. Реализованные экраны мобильного приложения (`mobile/`)

Мобильное приложение разработано в соответствии со стандартами **UI/UX Pro Max**:
1. **Главный дашборд (`DashboardScreen`)**: Быстрая статистика запущенных кампаний, статус автономности бренда, плашка экстренной остановки публикаций, виджет быстрого перехода в AI Студию.
2. **Календарь публикаций (`CalendarScreen`)**: Мобильный таймлайн с группировкой по датам, бейджами соцсетей и счетчиком постов, требующих проверки (`NEEDS_REVIEW`).
3. **Генератор контента (`GeneratorScreen`)**: Создание текстовых публикаций через Claude с учетом целевой аудитории и тональности.
4. **AI Creative Studio (`CreativeStudioScreen`)**:
   - Переключение вкладок: **Фото & Баннеры**, **Reels & Видео**, **Медиатека**.
   - Горизонтальная карусель готовых бизнес-пресетов («Сезонный латте», «Свежая выпечка», «Reels-напиток», «Баннер скидок»).
   - Выбор формата кадра (`1:1`, `9:16`, `16:9`).
   - Переключатель фирменного оверлея (детерминированная отрисовка бренда, точной цены из меню, бейджа акции и кнопки CTA).
   - Индикатор прогресса генерации и встроенный предпросмотр результата.
   - Модальное окно быстрого прикрепления готового визуала к посту в соцсеть.
5. **Каналы и соцсети (`ChannelsScreen`)**: Подключение Telegram, VK, Instagram, YouTube, TikTok с проверкой токенов.
6. **Профиль бренда (`BrandScreen`)**: Редактирование фактов о бизнесе, меню, адресов и режима автономии.
7. **Аналитика (`AnalyticsScreen`)**: Карточки ключевых KPI, графики охватов и конверсий.
8. **Настройки (`SettingsScreen`)**: Тема оформления, сессия пользователя, переключение адреса сервера.

---

## 4. Этап 4: AI Creative Studio — Архитектура и Решения

### Почему нейросеть не пишет текст на изображениях (ADR-014)
Генеративные диффузионные модели (DALL-E, Stable Diffusion, Midjourney) часто галлюцинируют надписи, портят кириллические шрифты и искажают цены (например, пишут 250₽ вместо 320₽).
**Решение**:
- Базовое изображение продукта/сцены генерируется без текста в высоком разрешении.
- Модуль `CreativeOverlayRenderer` (Java2D / Graphics2D) накладывает векторный детерминированный слой:
  - Фирменную плашку со стеклянным градиентом (Glassmorphism).
  - Название бренда.
  - Точную цену из меню кофейни (крупным шрифтом золотистого оттенка).
  - Промо-бейдж («Сезонная новинка», «Хит продаж»).
  - Кнопку призыва к действию (CTA).
  - Вероятность ошибки цены равна **0%**.

### Асинхронное создание видеороликов (ADR-015)
- Создание видео — тяжелая операция. Бэкенд возвращает статус `PENDING` с ID задачи (`CreativeTask`).
- Клиент (Web и Flutter) опрашивает статус через `/api/v1/creative/tasks/{id}`.
- В Docker-контейнер бэкенда установлены утилиты `ffmpeg`, `font-noto` и `freetype`.
- Видео генерируется в формате **9:16 (1080x1920)** с плавным наездом камеры (Ken Burns zoom), кодеком `libx264` и флагом `+faststart` для мгновенного стриминга на смартфонах.

---

## 5. Доступ к живому окружению

- **Web-платформа**: `https://allows-thread-dedicated-screening.trycloudflare.com` (или локально `http://localhost:3000`)
- **Backend API & Swagger**: `https://allows-thread-dedicated-screening.trycloudflare.com/swagger-ui.html`
- **Скачивание релизного Android APK**: `https://allows-thread-dedicated-screening.trycloudflare.com/contentpilot.apk`
- **Локальный путь к APK**: `D:\dev\ContentPilot\mobile\build\app\outputs\flutter-apk\app-release.apk`


---

## 6. Результаты реального тестирования MVP (100% Passed)

### A. Live End-to-End Integration Tests (`scripts/test_live_mvp.py`)
Сквозное автоматическое тестирование живого бэкенда, БД и медиа-контейнеров:
- **14/14 шагов успешно пройдено**:
  1. `POST /api/v1/auth/register` — Регистрация уникального пользователя и выдача JWT.
  2. `POST /api/v1/auth/login` — Аутентификация и проверка токенов.
  3. `POST /api/v1/brands` — Создание профиля бренда с фактами, адресом и меню (Brand Memory).
  4. `GET /api/v1/channels/capabilities` — Проверка возможностей платформ (Telegram, VK, Instagram, TikTok, YouTube).
  5. `POST /api/v1/campaigns` — Генерация контент-плана на 7 дней (4 публикации).
  6. `GET /api/v1/creative/presets` — Проверка бизнес-пресетов студии.
  7. `POST /api/v1/creative/images` — Генерация изображения с детерминированным оверлеем цены (350 ₽).
  8. `GET /uploads/creative/*.png` — Проверка отдачи статики (250 КБ, HTTP 200, PNG).
  9. `POST /api/v1/creative/videos` — Асинхронный запуск видеозадачи (Shorts 9:16).
  10. `GET /api/v1/creative/tasks/{id}` — Опрос статуса задачи до 100% COMPLETED.
  11. `GET /uploads/creative/*.mp4` — Проверка валидности MP4 видеопотока (415 КБ, HTTP 200).
  12. `GET /api/v1/creative/media` — Проверка сохранения материалов в медиатеку бренда.
  13. `POST /api/v1/creative/media/{id}/attach-post` — Прикрепление медиа к публикации в Telegram.
  14. `POST /api/v1/posts/stop-all` — Экстренная остановка всех постов в режим PAUSED.

### B. Backend Unit & Regression Tests (Maven / JUnit 5)
- [`CreativeOverlayRendererTest`](file:///D:/dev/ContentPilot/backend/src/test/java/com/contentpilot/creative/CreativeOverlayRendererTest.java): проверка отрисовки цен, бейджей и CTA в форматах 1:1 и 9:16 (**2 теста Passed**).
- [`FallbackImageProviderTest`](file:///D:/dev/ContentPilot/backend/src/test/java/com/contentpilot/creative/FallbackImageProviderTest.java): поддержка соотношений сторон 1:1, 9:16, 16:9 (**1 тест Passed**).
- [`CreativePresetsTest`](file:///D:/dev/ContentPilot/backend/src/test/java/com/contentpilot/creative/CreativePresetsTest.java): валидация бизнес-пресетов (**1 тест Passed**).
- [`ClaudeGenerationServiceTest`](file:///D:/dev/ContentPilot/backend/src/test/java/com/contentpilot/generation/ClaudeGenerationServiceTest.java): генерация постов для соцсетей (**1 тест Passed**).
- [`VerificationServiceTest`](file:///D:/dev/ContentPilot/backend/src/test/java/com/contentpilot/verification/VerificationServiceTest.java): факт-чекинг цен и перевод неверных цен в статус `NEEDS_REVIEW` (**2 теста Passed**).
- **Итог**: `Tests run: 7, Failures: 0, Errors: 0, Skipped: 0` (BUILD SUCCESS).

### C. Mobile Flutter Tests (`mobile/test/`)
- [`creative_models_test.dart`](file:///D:/dev/ContentPilot/mobile/test/creative_models_test.dart): сериализация/десериализация моделей задач, ассетов и пресетов (**3 теста Passed**).
- [`theme_tokens_test.dart`](file:///D:/dev/ContentPilot/mobile/test/theme_tokens_test.dart): проверка токенов темной и светлой палитры UI/UX Pro Max (**2 теста Passed**).
- [`widget_test.dart`](file:///D:/dev/ContentPilot/mobile/test/widget_test.dart): smoke-тест рендеринга приложения (**1 тест Passed**).
- **Итог**: `All tests passed! (6/6)`.
