# 🎯 FindAFriend — Find a Friend (API)

[![TypeScript](https://img.shields.io/badge/TypeScript-000000?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-20232A?style=for-the-badge&logo=fastify)](https://www.fastify.io/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-000000?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=githubactions)](https://github.com/features/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

A modern, well-tested backend API for animal adoption — the FindAFriend project. Built with SOLID principles, TypeScript, Fastify, Prisma and covered by integration tests (Vitest).

---

## ✨ Project Overview

FindAFriend exposes endpoints to manage organizations (orgs) and pets for adoption. The implementation focuses on:

- Clear separation between routes, schemas and service layer
- Transactions and safe photo handling (createMany fallback)
- Robust test suite covering core flows (register, login, create pet, list pets, adopt)
- Compatibility with SQLite for local development, and design that works with Postgres for production

---

## 📁 Project Structure (simplified)

```
FindAFriend
├── api
│   ├── src
│   │   ├── app
│   │   │   └── server.ts         # Fastify server bootstrap
│   │   ├── lib
│   │   │   ├── prisma.ts         # Prisma client
│   │   │   └── errors.ts         # AppError / HTTP error helpers
│   │   ├── modules
│   │   │   ├── orgs
│   │   │   │   ├── orgs.routes.ts
│   │   │   │   └── orgs.spec.ts  # tests
│   │   │   └── pets
│   │   │       ├── pets.service.ts
│   │   │       ├── pets.routes.ts
│   │   │       ├── pets.schemas.ts
│   │   │       └── pets.test.ts
│   │   └── main.ts               # app entry (dev)
│   ├── prisma
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

Prerequisites:
- Node.js 18+ (or latest LTS)
- npm or yarn
- (Optional) SQLite installed for local debugging, or a PostgreSQL URL for production

Steps:

1. Clone the repo:
   ```bash
   git clone https://github.com/solozabal/rocketseat-node-js-challenge-03.git
   cd rocketseat-node-js-challenge-03/api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables (copy `.env.example` → `.env` and update):
   - DATABASE_URL (e.g. sqlite: file:./dev.db or postgres url)
   - JWT_SECRET
   - PORT (optional)

4. Generate Prisma client (if schema changed):
   ```bash
   npx prisma generate
   ```

5. Run tests:
   ```bash
   npx vitest run
   ```

6. Start dev server:
   ```bash
   npm run dev
   # or
   npm start
   ```

---

## 🧪 Scripts

Common npm scripts available in `package.json`:

- npm run dev — start in development mode (nodemon / ts-node or equivalent)
- npm start — start compiled/production server
- npm run build — compile TypeScript to JS
- npm test / npx vitest run — run tests
- npx prisma generate — regenerate Prisma client
- npx prisma migrate dev — (if using migrations) create/apply migrations
- npm run lint / npm run format — (if configured)

---

## 📦 Technologies & Tools

- TypeScript — type-safe backend
- Fastify — fast web framework
- Prisma — ORM (SQLite for local tests, Postgres friendly)
- Vitest — testing (unit & integration)
- Zod — request validation (schemas)
- GitHub Actions — CI (recommended)
- Node.js — runtime

---

## 🔌 Implemented Endpoints (summary)

- POST /orgs
  - Register an organization (returns org + token).
- POST /sessions
  - Authenticate org and return JWT.
- GET /orgs/me
  - Returns current authenticated org info.
- POST /pets
  - Create a pet (authenticated).
- GET /pets
  - List pets (city query required for listing in current implementation).
- GET /pets/:id
  - Get pet by id.
- PATCH /pets/:id/adopt
  - Mark pet adopted or not (owner only).
- PATCH /pets/:id
  - Update pet (owner only).
- DELETE /pets/:id
  - Delete pet (owner only).
- GET /orgs/:orgId/pets
  - List pets by org.

Sample request (create pet):
```bash
curl -X POST http://localhost:3000/pets \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rex",
    "description": "Friendly dog",
    "species": "dog",
    "age": 3,
    "size": "medium",
    "photo_urls": ["https://.../rex.jpg"],
    "environment": "indoor",
    "independence": "medium"
  }'
```

---

## 🧩 Notes on Testing & SQLite Concurrency

SQLite locks can cause intermittent failures when multiple test workers or processes access the same DB file concurrently. Mitigations used in this project:

- Test cleanup uses an atomic transaction and a retry/backoff helper (clearDb) to avoid transient ConnectorError timeouts.
- If you still experience flakes, try:
  - stop local dev server(s) before running tests
  - run tests sequentially: `npx vitest run src/modules/...` (single file) or configure Vitest to run without worker threads
  - use distinct DB files per worker or use WAL mode:
    ```ts
    await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL;')
    ```

---

## 🔒 Environment variables

Create a `.env` at `api/.env` with at least:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret"
PORT=3000
NODE_ENV=development
```

When using Postgres for production, set DATABASE_URL accordingly.

---

## 🛠️ Development tips

- Keep schema validation centralized (Zod) — it helps tests and route contracts remain consistent.
- Use Prisma transactions for multi-step operations (create pet + photos).
- Keep tests deterministic — create/cleanup records inside tests and prefer seeding minimal required data.

---

## 🤝 Contributing

Contributions are welcome! Suggested flow:

1. Fork the repo
2. Create a feature branch (e.g. `feat/<something>`)
3. Implement your changes and add tests
4. Open a Pull Request with a clear title and description
5. Ensure CI/tests pass before merging

---

## 📝 Changelog (high level)

- Added Pets module: routes, services, schemas and tests
- Added Orgs auth/registration flows and tests
- Made DB cleanup in tests resilient to SQLite locks
- Implemented pagination, filters and safe photo handling

---

## ❤️ Thanks & License

If you found this project useful or learned from it — thank you!  
Licensed under the MIT License.

---

Made with ❤️ by the FindAFriend contributors — iterate, refactor and refine.