# Backend (Prisma + Express)

Quick local setup

1. Copy `.env.example` to `.env` and adjust if needed (DATABASE_URL, PORT, JWT_SECRET).
2. From repository root run `npm install` (workspaces are configured) or from `/backend` run `npm install`.
3. Generate Prisma client and push schema:
   - `npx prisma generate` (or `npm run prisma:generate`)
   - `npx prisma db push` (or `npm run prisma:db:push`)
4. Seed dev data: `npm run seed` (from `/backend`)
5. Start backend server in dev mode: `npm run dev` (from `/backend`) or from repo root: `npm run dev:backend`.

Notes for running frontend + backend in dev

- The frontend dev server is configured to proxy `/api` to `http://127.0.0.1:4000` so you can run frontend with `npm run dev` and backend with `npm run dev:backend` simultaneously and the frontend will call the backend at `/api/*`.

Endpoints

- `POST /api/register` — body: `{ email, password, name? }` — returns `{ token, user }` on success.
- `POST /api/login` — body: `{ email, password }` — returns `{ token, user }` on success.
- `GET /api/me` — headers: `Authorization: Bearer <token>` — returns `{ user }` (requires valid token).

If you'd like, I can add a `dev` script that runs both frontend and backend together using concurrency tools; tell me if you'd prefer that.


npm install
cp backend/.env.example backend/.env && echo '--- backend/.env ---' && sed -n '1,120p' backend/.env
npm --workspace me-backend run prisma:generate && npm --workspace me-backend run prisma:db:push
npm --workspace me-backend run seed
npm --workspace me-backend run dev