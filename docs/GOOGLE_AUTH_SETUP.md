# Руководство по выпуску и настройке Google OAuth секретов для ContentPilot

В данном руководстве описан пошаговый процесс получения **Google Client ID** и **Client Secret** в Google Cloud Console для веб-версии (React) и мобильного приложения (Flutter Android), а также их подключение к бэкенду ContentPilot.

---

## 1. Регистрация проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/).
2. Войдите в свой рабочий Google-аккаунт.
3. В верхнем меню нажмите на селектор проектов и выберите **"New Project"** (Создать проект).
4. Укажите название: `ContentPilot` и нажмите **Create**.

---

## 2. Настройка экрана согласия (OAuth Consent Screen)

Перед выпуском ключей Google требует настроить экран согласия:

1. В левом боковом меню перейдите в **APIs & Services** → **OAuth consent screen**.
2. Выберите тип пользователя:
   - **External** (Внешний) — для доступа любым пользователям с Google-аккаунтом. Нажмите **Create**.
3. Заполните обязательные поля:
   - **App name**: `ContentPilot`
   - **User support email**: ваш email
   - **App logo**: (опционально)
   - **Application home page**: `https://allows-thread-dedicated-screening.trycloudflare.com`
   - **Developer contact information**: ваш email
4. Нажмите **Save and Continue**.
5. На шаге **Scopes** нажмите **Add or Remove Scopes** и выберите:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. Нажмите **Update** → **Save and Continue**.
7. На шаге **Test users** добавьте email-адреса, с которых будете тестировать вход (пока приложение в статусе Testing).
8. Нажмите **Save and Continue**.

---

## 3. Выпуск ключей для Web (React 19)

1. В левом меню перейдите в **APIs & Services** → **Credentials**.
2. Вверху нажмите **+ Create Credentials** → **OAuth client ID**.
3. В поле **Application type** выберите **Web application**.
4. В поле **Name** введите: `ContentPilot Web Client`.
5. В блоке **Authorized JavaScript origins** (Разрешенные источники JavaScript) нажмите **+ Add URI** и укажите:
   - `https://allows-thread-dedicated-screening.trycloudflare.com` (текущий публичный домен)
   - `http://localhost:3000` (для локальной разработки)
   - `http://127.0.0.1:3000`
6. В блоке **Authorized redirect URIs** (Разрешенные URI перенаправления) добавьте:
   - `https://allows-thread-dedicated-screening.trycloudflare.com`
   - `http://localhost:3000`
7. Нажмите **Create**.
8. Появится модальное окно с:
   - **Client ID** (вида `1234567890-abcdefg.apps.googleusercontent.com`)
   - **Client Secret** (секретный ключ)
9. Скопируйте оба значения.

---

## 4. Выпуск ключей для Android (Flutter)

Для нативного входа через Google в приложении Android:

1. Получите SHA-1 отпечаток вашего ключа разработки (Debug Keystore).
   Выполните в консоли:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
   *(На Windows путь обычно: `C:\Users\<Имя_Пользователя>\.android\debug.keystore`)*.
2. В Google Cloud Console нажмите **+ Create Credentials** → **OAuth client ID**.
3. Выберите **Application type**: **Android**.
4. Укажите:
   - **Name**: `ContentPilot Android Client`
   - **Package name**: `com.contentpilot.contentpilot_mobile` (из `mobile/android/app/build.gradle.kts`)
   - **SHA-1 certificate fingerprint**: вставьте скопированный SHA-1 отпечаток.
5. Нажмите **Create**.

---

## 5. Подключение ключей в ContentPilot

### A. Бэкенд (`.env` и `application.yml`)
В файле `.env` в корне проекта добавьте:
```env
GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
```

### B. Веб-фронтенд (`frontend/`)
В файле `frontend/index.html` перед закрывающим тегом `</head>` подключена официальная библиотека Google Identity Services (GIS):
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```
Вход инициализируется через:
```javascript
window.google.accounts.id.initialize({
  client_id: "ВАШ_GOOGLE_CLIENT_ID",
  callback: handleCredentialResponse
});
```
Полученный `credential` (ID токен) отправляется в бэкенд на эндпоинт `POST /api/v1/auth/google`.

### C. Бэкенд-верификация (`AuthService.java`)
Бэкенд проверяет цифровую подпись токена через эндпоинт Google:
`https://oauth2.googleapis.com/tokeninfo?id_token={idToken}`
Если токен валиден, создается или авторизуется реальный пользователь, привязывается `google_sub` и выдается JWT сессия ContentPilot.
