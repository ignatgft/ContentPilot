# ContentPilot 2.0 🚀

> **ИИ-маркетолог на автопилоте для малого бизнеса**  
> Проект для хакатона: бизнес-цель → стратегия → генерация → проверка → публикация → измерение → рекомендации.

---

## 📁 Структура проекта

```
ContentPilot/
├── frontend/               # React 19 + Vite + TypeScript + Tailwind CSS
├── backend/                # Spring Boot 3 (Java 21) + Flyway + JPA + Security
├── design-kit/             # Дизайн-система (SVG иконки, логотипы, аватары, токены CSS)
├── docs/                   # Техническое задание и спецификация API
│   ├── ContentPilot_ТЗ.md
│   ├── API.md
│   └── renders.html
├── docker-compose.yml      # Запуск всего стека (PostgreSQL, Backend, Frontend)
├── .env.example            # Пример переменных окружения
└── README.md
```

---

## 🛠 Технологический стек

- **Фронтенд:** React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router.
- **Бэкенд:** Java 21, Spring Boot 3.3.4, Spring Security (JWT + OAuth2), Spring Data JPA, Flyway, springdoc-openapi.
- **База данных:** PostgreSQL 16.
- **Планировщик:** Spring `@Scheduled` + таблица задач PostgreSQL.
- **ИИ:** Claude API (Anthropic REST client).
- **Интеграции:** Telegram Bot API.

---

## 🚀 Быстрый запуск

### С использованием Docker Compose:
```bash
cp .env.example .env
docker compose up --build
```
- Фронтенд: [http://localhost:3000](http://localhost:3000)
- Бэкенд API: [http://localhost:8080](http://localhost:8080)
- Swagger UI документация: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

### Локальная разработка:

#### 1. База данных
```bash
docker run --name contentpilot-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=contentpilot -p 5432:5432 -d postgres:16-alpine
```

#### 2. Бэкенд
```bash
cd backend
./mvnw spring-boot:run
```

#### 3. Фронтенд
```bash
cd frontend
npm install
npm run dev
```

---

## 🎯 Сценарий демо (3 минуты)

1. Регистрация/вход нового пользователя.
2. Онбординг бренда: кофейня (меню, цены, часы работы, локация, адреса).
3. Постановка цели: «Продвинуть сезонный латте Тыква-Пряности».
4. Генерация постов с проверкой:
   - Обнаружение расхождения фактов/цен (`NEEDS_REVIEW`).
   - Исправление и подтверждение.
5. Автоматическая публикация в Telegram-канал по расписанию или кнопке «Опубликовать сейчас».
6. Сбор аналитики и просмотр рекомендаций.
