# Do-Daily Fastify Backend

Высокопроизводительный сервер на базе **Fastify**, **TypeScript**, **Supabase** и **Expo Server SDK** для приложения Do-Daily.

---

## 🛠 Возможности

- **Fastify 5**: Ультрабыстрый HTTP-фреймворк с минимальным потреблением RAM (идеально для бесплатного тарифа Render 512MB).
- **Supabase JWT Auth**: Аутентификация через заголовок `Authorization: Bearer <token>` с проверкой сессии в Supabase.
- **REST API**:
  - `GET /health` — проверка работоспособности для мониторинга Render.
  - `GET, PUT /api/profile` — получение и редактирование профиля пользователя.
  - `POST /api/profile/push-token` — сохранение Expo Push Token.
  - `GET, POST, PUT, DELETE /api/tasks` — управление задачами.
  - `POST /api/tasks/clear-completed` — очистка выполненных задач.
  - `GET /api/stats/summary` — расчет метрик, продуктивности, категорий и графика.
- **Фоновые Cron-задачи**:
  - Каждые 5 минут: проверка предстоящих задач и отправка Push-уведомлений через Expo Push API.
  - Каждую полночь в 00:01: закрытие просроченных задач (`status: failed`).

---

## 🚀 Локальный запуск

1. Перейдите в папку сервера:
   ```bash
   cd server
   ```

2. Установите зависимости:
   ```bash
   npm install
   ```

3. Создайте файл `.env` на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Укажите значения:
   - `SUPABASE_URL` — URL вашего проекта Supabase (Settings -> API).
   - `SUPABASE_SERVICE_ROLE_KEY` — секретный ключ Service Role (Settings -> API).

4. Запустите в режиме разработки:
   ```bash
   npm run dev
   ```

---

## 🌐 Деплой на Render

1. Зарегистрируйтесь на [render.com](https://render.com).
2. Нажмите **New +** -> **Web Service**.
3. Подключите ваш Git-репозиторий.
4. Укажите параметры сервиса:
   - **Name**: `do-daily-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. В разделе **Environment Variables** добавьте:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `HOST` = `0.0.0.0`
   - `SUPABASE_URL` = `https://ваш-проект.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = `ваш_секретный_service_role_key`
6. Нажмите **Create Web Service**.
7. После успешного деплоя проверьте эндпоинт:
   `https://do-daily-backend.onrender.com/health` (должен вернуть `{"status":"ok"}`).

