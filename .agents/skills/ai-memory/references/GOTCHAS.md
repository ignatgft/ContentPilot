# ⚠️ Hall of Gotchas & Lessons Learned — ContentPilot 2.0

Этот каталог предотвращает повторение неочевидных ошибок и сохраняет время будущих разработчиков и ИИ-агентов.

---

### 1. Hibernate `cascade="all-delete-orphan"` и замена ссылок на коллекции
- **Симптом**: `org.springframework.orm.jpa.JpaSystemException: A collection with cascade="all-delete-orphan" was no longer referenced by the owning entity instance: com.contentpilot.campaign.Campaign.posts`.
- **Причина**: Попытка вызвать `campaign.setPosts(savedPosts)` заменяет внутреннюю коллекцию, управляемую прокси Hibernate, новым списком в памяти, что нарушает контракт `orphanRemoval = true`.
- **Решение**: Никогда не переприсваивать ссылку на коллекцию. Использовать:
  ```java
  campaign.getPosts().add(post);
  // или
  campaign.getPosts().clear();
  campaign.getPosts().addAll(savedPosts);
  ```

---

### 2. Spring Security маскирует 4xx/5xx ошибки в 403 Forbidden через `/error`
- **Симптом**: Любой запрос с неверными аргументами или ошибкой валидации внезапно возвращает пустой `403 Forbidden` вместо `400 Bad Request`.
- **Причина**: Spring MVC перенаправляет исключения на стандартный servlet `/error`. Если `/error` не добавлен в `.permitAll()` в `SecurityConfig`, `AuthorizationFilter` блокирует его как неаутентифицированный.
- **Решение**: Всегда включать `/error` в белый список публичных путей:
  ```java
  .requestMatchers("/api/v1/auth/**", "/error", "/v3/api-docs/**").permitAll()
  ```

---

### 3. Windows PowerShell: блокировка скрипта `npm.ps1`
- **Симптом**: `npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system`.
- **Причина**: PowerShell Execution Policy по умолчанию блокирует запуск внешних `.ps1` скриптов.
- **Решение**: В среде Windows PowerShell всегда вызывать `npm.cmd` и `npx.cmd` вместо голого `npm`.

---

### 4. CRLF переводы строк в Maven Wrapper (`mvnw`) внутри Linux Docker
- **Симптом**: Ошибка `/bin/sh: ./mvnw: not found` при запуске контейнера с Alpine Linux.
- **Причина**: Git на Windows автоматически сохраняет файлы с CRLF (`\r\n`), что ломает шебанг `#!/bin/sh` в Linux.
- **Решение**: В multi-stage `backend/Dockerfile` использовать готовый базовый образ `maven:3.9.9-eclipse-temurin-21-alpine` вместо копирования скрипта `mvnw`.

---

### 5. Windows cp1251 и символ рубля `₽` (\u20bd)
- **Симптом**: `UnicodeEncodeError: 'charmap' codec can't encode character '\u20bd' in position 56: character maps to <undefined>`.
- **Причина**: Консоль Windows по умолчанию использует кодировку CP1251 / CP866, в которой отсутствует глиф символа рубля.
- **Решение**: При выводе логов или консольных тестов в Python использовать явную бинарную запись `sys.stdout.buffer.write(msg.encode('utf-8'))` или устанавливать `$env:PYTHONIOENCODING='utf-8'`.
