# ContentPilot REST API Specification

## Base URL
`/api/v1`

---

## 1. Authentication (`/api/v1/auth`)

### POST `/api/v1/auth/register`
Регистрация нового пользователя.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Response 201 Created:**
  ```json
  {
    "token": "jwt-access-token",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
  ```

### POST `/api/v1/auth/login`
Аутентификация по почте и паролю.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Response 200 OK:**
  ```json
  {
    "token": "jwt-access-token",
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
  ```

### POST `/api/v1/auth/google`
Вход через Google OAuth ID-токен.
- **Request Body:**
  ```json
  {
    "idToken": "google-id-token"
  }
  ```

### POST `/api/v1/auth/logout`
Выход из системы (удаление refresh-токена).

---

## 2. Brand Management (`/api/v1/brands`)

### GET `/api/v1/brands/me`
Получить профиль текущего бренда пользователя.

### POST `/api/v1/brands`
Создать или обновить профиль бренда.
- **Request Body:**
  ```json
  {
    "name": "Coffee Point",
    "description": "Уютная спешелти кофейня",
    "audience": "Студенты, фрилансеры 20-35 лет",
    "tone": "Дружелюбный, теплый",
    "facts": {
      "menu": [
        {"name": "Сезонный латте Тыква-Пряности", "price": 320},
        {"name": "Капучино", "price": 250}
      ],
      "schedule": "Пн-Вс 08:00 - 22:00",
      "address": "ул. Примерная, 10"
    },
    "autonomyMode": "MANUAL",
    "samples": [
      "Приходите за согревающим латте!"
    ]
  }
  ```

---

## 3. Campaigns (`/api/v1/campaigns`)

### POST `/api/v1/campaigns`
Создание кампании с запуском генерации.
- **Request Body:**
  ```json
  {
    "goal": "Продвинуть сезонный латте Тыква-Пряности",
    "periodStart": "2026-10-25",
    "periodEnd": "2026-11-01"
  }
  ```

### GET `/api/v1/campaigns`
Список кампаний бренда.

### GET `/api/v1/campaigns/{id}`
Детали кампании вместе со списком публикаций.

---

## 4. Posts & Verification (`/api/v1/posts`)

### GET `/api/v1/posts`
Список публикаций с фильтрацией по статусу или кампании.
Статусы: `DRAFT`, `NEEDS_REVIEW`, `SCHEDULED`, `PUBLISHING`, `PUBLISHED`, `FAILED`, `PAUSED`.

### PUT `/api/v1/posts/{id}`
Редактирование текста, времени и параметров публикации.

### POST `/api/v1/posts/{id}/verify`
Принудительная повторная проверка поста по фактам бренда и правилам площадок.

### POST `/api/v1/posts/{id}/approve`
Ручное утверждение поста после `NEEDS_REVIEW` (перевод в `SCHEDULED`).

### POST `/api/v1/posts/{id}/publish-now`
Немедленная публикация в подключенный Telegram-канал.

### POST `/api/v1/posts/stop-all`
Кнопка «Остановить всё»: перевод всех запланированных постов бренда в `PAUSED`.

---

## 5. Channels (`/api/v1/channels`)

### GET `/api/v1/channels`
Список подключенных каналов бренда.

### POST `/api/v1/channels/telegram`
Подключение Telegram-канала:
- **Request Body:**
  ```json
  {
    "externalId": "@my_coffee_channel",
    "botToken": "123456:ABC-DEF..."
  }
  ```

---

## 6. Analytics (`/api/v1/analytics`)

### GET `/api/v1/analytics/overview`
Сводка показателей: просмотры, реакции, клики, динамика и рекомендации ИИ на базе реальных данных.
