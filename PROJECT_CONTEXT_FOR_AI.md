# ContentPilot 2.0 — Полный контекст проекта для ИИ-агентов и LLM

> **Назначение файла:** Данный документ содержит исчерпывающее описание архитектуры, кодовой базы, API-контрактов, моделей данных и статуса реализации проекта **ContentPilot 2.0** для быстрого погружения любой ИИ-модели или разработчика.

---

## 1. Обзор проекта

**ContentPilot** — омниканальная AI-платформа для автоматизации контент-маркетинга малого бизнеса.
Сервис позволяет владельцу бизнеса (например, локальной кофейне, салону, магазину):
1. Задать память бренда: факты, меню, цены, адрес, часы работы, целевую аудиторию и тон общения (Tone of Voice).
2. В 1 клик сгенерировать кампанию или недельный автопилот публикаций под выбранную бизнес-цель.
3. Автоматически провести серверный фактчекинг (сверка цен и фактов с памятью бренда; при несовпадении пост переводится в `NEEDS_REVIEW` и блокируется до подтверждения/исправления).
4. Опубликовать адаптированные посты в социальные сети: **Telegram**, **ВКонтакте**, **YouTube Shorts**, **Instagram**, **TikTok**.
5. Управлять публикациями через интерактивный календарь, отслеживать метрики и использовать кнопку экстренной остановки «Остановить всё» (Kill Switch).

---

## 2. Структура монорепозитория

```
ContentPilot/
├── backend/                  # Java 21, Spring Boot 3.3.4, Spring Security, Spring Data JPA, Flyway
├── frontend/                 # React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Nginx
├── mobile/                   # Flutter 3.47 (Dart 3.13), Flutter Riverpod, Dio, Secure Storage, Material 3
├── design-kit/               # Брендбук, токены (tokens.json, tokens.css), SVG логотипы и иконки
├── docs/                     # ТЗ Этап 1 и ТЗ Этап 2 (соцсети, Flutter, доступ с телефона)
├── .agents/                  # Память ИИ-агента (ai-memory: архитектура, решения, статус)
├── docker-compose.yml        # Оркестрация: PostgreSQL 16, backend, frontend
├── PROJECT_CONTEXT_FOR_AI.md # Этот файл — глобальный контекст для ИИ-моделей
└── README.md
```

---

## 3. Бэкенд (backend/)

### Стек:
- **Язык & Фреймворк:** Java 21, Spring Boot 3.3.4
- **Безопасность:** Spring Security (Stateless JWT, HMAC-SHA384)
- **База данных:** PostgreSQL 16, Spring Data JPA, Hibernate ORM
- **Миграции:** Flyway (`V1__init_schema.sql`)
- **Документация API:** OpenAPI 3.0 / Swagger UI (`/swagger-ui/index.html`)
- **Порт в локальной сети:** `8080` (привязан к `0.0.0.0`)

### Специфика авторизации (Web + Mobile):
- Для Web-клиента: access token в ответе, refresh token в `HttpOnly` cookie.
- Для Mobile-клиента (заголовок `X-Client: mobile`):
  - При `POST /api/v1/auth/login` и `POST /api/v1/auth/register` бэкенд возвращает `refreshToken` прямо в теле JSON-ответа: `{ "token": "...", "refreshToken": "...", "user": { "id": 1, "email": "..." } }`.
  - Эндпоинт `POST /api/v1/auth/refresh` принимает JSON `{ "refreshToken": "..." }` и возвращает обновленную пару токенов.

### Полный реестр REST API бэкенда:

| Метод | Эндпоинт | Назначение | Тело запроса / Параметры |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Регистрация нового пользователя | `{ email, password, name }` |
| `POST` | `/api/v1/auth/login` | Вход по логину/паролю | `{ email, password }` |
| `POST` | `/api/v1/auth/google` | Вход через Google ID Token | `{ idToken }` |
| `POST` | `/api/v1/auth/refresh` | Обновление access токена | `{ refreshToken }` (или Cookie) |
| `POST` | `/api/v1/auth/logout` | Выход из системы | — |
| `GET`  | `/api/v1/auth/me` | Текущий пользователь | Bearer Token |
| `GET`  | `/api/v1/brands/me` | Профиль бренда пользователя | Bearer Token |
| `POST` | `/api/v1/brands` | Создание / обновление бренда | `{ name, description, audience, tone, facts, autonomyMode, samples }` |
| `GET`  | `/api/v1/campaigns` | Список кампаний бренда | Bearer Token |
| `POST` | `/api/v1/campaigns` | Создание кампании + генерация постов | `{ goal, periodStart, periodEnd }` |
| `GET`  | `/api/v1/campaigns/{id}` | Детали кампании по ID | Bearer Token |
| `GET`  | `/api/v1/posts` | Все публикации бренда | Bearer Token |
| `PUT`  | `/api/v1/posts/{id}` | Редактирование поста | `{ text, platform, mediaUrl, scheduledAt }` |
| `POST` | `/api/v1/posts/{id}/verify` | Запуск фактчекинга поста | — |
| `POST` | `/api/v1/posts/{id}/approve` | Ручное подтверждение (перевод из `NEEDS_REVIEW` в `SCHEDULED`) | — |
| `POST` | `/api/v1/posts/{id}/publish-now` | Немедленная отправка в соцсеть | — |
| `POST` | `/api/v1/posts/stop-all` | Кнопка «Остановить всё» (`PAUSED`) | — |
| `GET`  | `/api/v1/channels/capabilities` | Лимиты и возможности соцсетей | Bearer Token |
| `GET`  | `/api/v1/channels` | Список подключенных каналов | Bearer Token |
| `POST` | `/api/v1/channels/{platform}` | Подключение канала (telegram, vk, youtube, instagram, tiktok) | `{ externalId, botToken }` |
| `GET`  | `/api/v1/analytics/overview` | Сводка просмотров, кликов и рекомендации ИИ | Bearer Token |

---

## 4. Мульти-паблишинг и фактчекинг

### Архитектура паблишеров (`com.contentpilot.publisher`):
1. `Publisher` — общий интерфейс (`publish(Post post)`, `testConnection(Channel channel)`, `getCapabilities()`).
2. `PublisherRegistry` — реестр платформ с авто-регистрацией Spring-бинов.
3. Реализации:
   - `TelegramPublisher`: Telegram Bot API (`sendMessage`, `sendPhoto`).
   - `VkPublisher`: VK API `wall.post`.
   - `YoutubePublisher`: YouTube Data API v3 Shorts.
   - `InstagramPublisher`: Meta Graph API (Reels & Photo) с предупреждением об аудите приложения.
   - `TiktokPublisher`: TikTok Content Posting API. Поддерживает статус `READY_MANUAL` (подготовка материалов к ручной публикации до завершения аудита).

### Фактчекинг (`VerificationService`):
- Сверяет упоминания числовых цен и фактов в тексте со списком меню и фактов из `Brand.facts`.
- Если цена в посте отличается от цены в меню (например, в тексте 250₽, а в меню 320₽), посту присваивается статус `NEEDS_REVIEW`.
- Посты в статусе `NEEDS_REVIEW` блокируются от автоматической и ручной публикации до нажатия «Исправить цену» или «Утвердить».

---

## 5. Веб-фронтенд (frontend/)

- **Стек:** React 19, Vite, Tailwind CSS, Lucide React, Nginx.
- **Порт:** `3000` (проброшен наружу на `0.0.0.0:3000`).
- **Nginx Config:** `server_name _;`, проксирование `/api/v1` на `http://backend:8080`.
- **Поддержка тем:** Тёмная и светлая темы с переключением через `ThemeContext`.
- **Экраны:**
  1. `AuthPage.tsx`: вход / регистрация.
  2. `BrandOnboardingPage.tsx`: настройка бренда + кнопка 3-мин демо.
  3. `CampaignGoalPage.tsx`: выбор целей кампании.
  4. `CampaignDetailsPage.tsx`: посты, карточки, фактчекинг.
  5. `CalendarPage.tsx`: 7-дневный календарь.
  6. `ChannelsPage.tsx`: мультиканальные карточки (Telegram, VK, YouTube, Instagram, TikTok).
  7. `AnalyticsPage.tsx`: графики, метрики и инсайты.
  8. `SettingsPage.tsx`: переключение тем, автономность, кнопка «Остановить всё».

---

## 6. Мобильное приложение (mobile/)

- **Стек:** Flutter 3.47, Dart 3.13, Flutter Riverpod 2.6, Dio 5.4, Flutter Secure Storage 9.2, GoRouter 14.8.
- **Поддержка платформ:** Android (minSdk 21, compileSdk 36, targetSdk 36, Java 17/Gradle 9.3).
- **Дизайн-система:** `AppTheme` на основе `design-kit/tokens.json` (Material 3, динамическая тёмная и светлая темы).
- **Сетевой клиент (`ApiClient`):**
  - Поддержка переключения базового URL (`192.168.10.181:8080`, `10.0.2.2:8080`).
  - Автоматическое добавление заголовка `X-Client: mobile`.
  - Автоматический перехват 401 ошибок, вызов `POST /api/v1/auth/refresh` и повтор запроса без разлогина пользователя.
- **Структура экранов:**
  - `AuthScreen`: экран входа и регистрации, валидация, быстрый демо-вход.
  - `DashboardScreen`: показатели, активный бренд, автопилот, ближайшая публикация, каналы.
  - `AutopilotDialog`: выбор бизнес-цели и генерация недельного контент-плана в 1 клик.
  - `GeneratorScreen`: генератор с адаптацией под площадки, фактчекингом и исправлением цен.
  - `CalendarScreen`: 7-дневный календарь, фильтры статусов, публикация в эфир.
  - `ChannelsScreen`: 5 площадок, лимиты символов, форматы, статусы аудита.
  - `BrandScreen`: редактор профиля, фактов и цен, кнопка «Заполнить кофейню для демо (3 мин)».
  - `AnalyticsScreen`: статистика просмотров/кликов, инсайты ИИ, топ постов.
  - `SettingsScreen`: смена сервера, переключение тем, Kill Switch «Остановить всё», логаут.

---

## 7. Развертывание и локальная сеть

- **Локальный IP машины:** `192.168.10.181`
- **Веб-версия с любого устройства в Wi-Fi сети:** `http://192.168.10.181:3000`
- **Бэкенд API:** `http://192.168.10.181:8080/api/v1`
- **Swagger документация:** `http://192.168.10.181:8080/swagger-ui/index.html`

### Команды для запуска:
```bash
# Запуск всего стека в Docker
docker compose up -d

# Сборка и запуск фронтенда локально
cd frontend && npm run build

# Сборка мобильного APK
cd mobile && flutter build apk --release

# Установка на подключенный Android-телефон
adb install -r mobile/build/app/outputs/flutter-apk/app-release.apk
```
