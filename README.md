# Pinboard

Pinterest-style web app: pins, boards, downloads, DMs, group chat, and pin sharing.

## Stack

- `apps/web` — React 19, Vite, TypeScript, TanStack Query, Zustand, Tailwind
- `apps/api` — Express, Prisma, PostgreSQL, Redis, Socket.io
- `packages/shared` — shared Zod schemas and types

## Local setup

1. Start Postgres and Redis: `docker compose up -d`
2. Copy env files:

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

3. Install and migrate:

```bash
npm install
npm run db:migrate
```

4. Run API and web:

```bash
npm run dev:api
npm run dev:web
```

Web: http://localhost:5173  
API: http://localhost:4000

Cloudinary is optional. If credentials are empty, uploads are stored under `apps/api/uploads`.
