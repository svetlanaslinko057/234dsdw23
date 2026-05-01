# PRD — ATLAS DevOS / EVA-X (deployed from GitHub)

## Источник
Репозиторий: `https://github.com/svetlanaslinko057/1234214dcdcddcd`
(склонирован, изучен, развёрнут в `/app`).

## Архитектура (3 слоя)

### 1. Backend — FastAPI + MongoDB + Socket.IO
- **Путь:** `/app/backend/` (server.py ≈ 880 KB + 80 модулей)
- **Порт:** `0.0.0.0:8001`, маршруты под `/api/*`
- **БД:** MongoDB (`mongodb://localhost:27017`, db=`atlas_devos`)
- **Realtime:** Socket.IO на `api/socket.io`
- **Ключевые модули:**
  acceptance / assignment / time_tracking / event_engine / decomposition_engine
  developer / client / admin layers (workspace, billing, escrow, transparency)
  auto_guardian / operator_engine / module_motion (фоновые петли)
  decision / earnings / scaling / revenue / system_truth
- **AI/embedding:** `sentence-transformers/all-MiniLM-L6-v2` (локально, при старте)
- **Auth:** cookie-сессии (`/api/auth/login`, `/auth/me`, `/auth/register`),
  bcrypt, поддержка Bearer для мобайла
- **Платежи:** WayForPay-совместимый провайдер + Mock в dev

### 2. Web React — клиент / девелопер / тестировщик / админ
- **Путь:** `/app/web/` (CRA + craco + Tailwind 3 + Radix UI)
- **Сборка:** `/app/web/build/` → отдаётся бэкендом по `/api/web-ui/*`
- **Главные роуты:**
  - `/` — лендинг (DevOS — Ship products, not tickets)
  - `/client/auth`, `/client/dashboard-os`, `/client/billing-os`, `/client/operator`, `/client/costs`, `/client/transparency`
  - `/builder/auth`, `/developer/dashboard`, `/developer/marketplace`, `/developer/workspace`, `/developer/earnings`, `/developer/intel/*`
  - `/tester/dashboard`, `/tester/validation`, `/tester/issues`
  - `/admin/login`, `/admin/dashboard`, `/admin/workflow`, `/admin/qa`, `/admin/finance`, `/admin/team`, `/admin/system`

### 3. Mobile Expo — EVA-X
- **Путь:** `/app/frontend/` (Expo Router 6, RN 0.81, React 19)
- **Порт:** Metro на `:3000`, ngrok-туннель для preview
- **Группы экранов:**
  `app/admin/*`, `app/client/*`, `app/developer/*`, `app/lead/*`, `app/operator/*`, `app/project/*`, `app/workspace/[id].tsx`
  + welcome / auth / chat / inbox / hub / gateway / settings / profile

## Env files
- `/app/backend/.env`: `MONGO_URL`, `DB_NAME=atlas_devos`, `EMERGENT_LLM_KEY`, `BACKEND_URL`, `WEB_BUILD_DIR`, `AUTH_SERVICE_URL`
- `/app/frontend/.env`: `EXPO_TUNNEL_SUBDOMAIN`, `EXPO_PACKAGER_HOSTNAME`, `EXPO_PUBLIC_BACKEND_URL` (защищены)
- `/app/web/.env`: `REACT_APP_BACKEND_URL`, `PUBLIC_URL=/api/web-ui`

## Сервисы (supervisor)
- `backend` — uvicorn 0.0.0.0:8001
- `expo` — Metro tunnel :3000
- `mongodb` — local 27017

## URL пользователя
- Web React: `https://expo-admin-portal.preview.emergentagent.com/api/web-ui/`
- Mobile Expo: `https://expo-admin-portal.preview.emergentagent.com/`
- API: `https://expo-admin-portal.preview.emergentagent.com/api/*`

## Тестовые аккаунты
См. `/app/memory/test_credentials.md`. Кратко:
admin@atlas.dev / admin123 · john@atlas.dev / dev123 ·
client@atlas.dev / client123 · multi@atlas.dev / multi123

## Известные ограничения / mocked
- **Email (Resend):** `RESEND_API_KEY` не задан → доставка отключена,
  OTP идёт в DEV-режиме (логи).
- **Cloudinary:** ключи не заданы → файлы сохраняются локально (MOCK).
- **Stripe / WayForPay:** в dev используется Mock-провайдер.
- **Google OAuth:** клиентский ID есть, но callback требует домен из реальной OAuth-консоли.
- **HF_TOKEN:** не установлен — embeddings скачиваются анонимно (rate-limit).

## Что было сделано
1. Склонировал `https://github.com/svetlanaslinko057/1234214dcdcddcd` в `/tmp/repo`.
2. Перенёс: `backend/` → `/app/backend/`, `frontend/` → `/app/frontend/` (защищённые env-переменные сохранены), `web/` → `/app/web/`.
3. Установил backend deps (`pip install -r requirements.txt` + `resend`, `cloudinary`).
4. Добавил Emergent LLM Key и недостающие переменные в `backend/.env`.
5. `yarn install` для `/app/frontend` и `/app/web`.
6. Собрал web: `CI=false DISABLE_ESLINT_PLUGIN=true yarn build` → `/app/web/build`.
7. Перезапустил `backend` и `expo`. Все три слоя отвечают:
   - GET `/api/web-ui/` → 200 (лендинг ATLAS DevOS)
   - GET `/` → Expo welcome (EVA-X)
   - POST `/api/auth/login` → 200 для всех 4 тестовых аккаунтов

## Next Action Items
- Добавить ключи: `RESEND_API_KEY`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`,
  `STRIPE_SECRET_KEY` / `WAYFORPAY_*`, `GOOGLE_CLIENT_SECRET`, `HF_TOKEN`.
- Решить, использовать ли в проде локальный или Atlas MongoDB.
- ESLint/exhaustive-deps варнинги в web — почистить позже (не блокируют).
