# 🐾 FindAFriend API

<p align="center"><i>Minimal, robust REST API for animal adoption organizations.<br>Powered by TypeScript, Fastify, Prisma & Vitest.<br>SOLID, tested, Docker-ready.</i></p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" alt="Fastify" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
  <img src="https://img.shields.io/badge/Zod-3E256F?style=for-the-badge&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/BcryptJS-5293C2?style=for-the-badge&logoColor=white" alt="bcryptjs" />
</p>

---

## ✨ Features
- **Orgs**: Register, authenticate, manage NGOs
- **Pets**: List, filter, register, manage pet profiles
- Auth: JWT-based, secure
- Validation: Zod schemas everywhere
- Healthcheck, CORS, Helmet, Rate Limit support

---

## 🦄 Quickstart

```bash
git clone https://github.com/solozabal/rocketseat-node-js-challenge-03.git
cd rocketseat-node-js-challenge-03/api
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev          # Typescript, nodemon, hot reload
# or
docker-compose up    # Production-ready Docker stack
```

---

## 📦 Directory

```
rocketseat-node-js-challenge-03/
├── api/
│   ├── .dockerignore
│   ├── .env.example
│   ├── .gitignore
│   ├── LICENSE
│   ├── docker-compose.yml
│   ├── dockerfile
│   ├── nodemon.json
│   ├── openapi.yaml
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── app/
│   │   │   └── server.ts
│   │   ├── lib/
│   │   │   ├── errors.ts
│   │   │   ├── hash.ts
│   │   │   ├── jwt.ts
│   │   │   └── prisma.ts
│   │   ├── modules/
│   │   │   ├── orgs/
│   │   │   │   ├── orgs.spec.ts
│   │   │   │   ├── routes.ts
│   │   │   │   ├── schemas.ts
│   │   │   │   └── service.ts
│   │   │   └── pets/
│   │   │       ├── pets.routes.ts
│   │   │       ├── pets.schemas.ts
│   │   │       ├── pets.service.ts
│   │   │       └── pets.test.ts
│   │   ├── plugins/
│   │   │   └── authenticate.ts
│   │   ├── routes/
│   │   │   └── health.routes.ts
│   │   └── types/
│   │       └── fastify.d.ts
│   └── test/
│       └── utils/
│           └── clear.db.ts
├── .gitattributes
├── LICENSE
└── README.md
```

---

## 🔗 API

- [openapi.yaml](api/openapi.yaml): Swagger 3.0.1—org registration, auth, usage.

### Prime Endpoints
- `POST /orgs` — Register a new organization
- `POST /sessions` — Authenticate and receive JWT
- `/pets` — Register, list, filter pets
- `/health` — Simple health check (for readiness/liveness)

---

## 🛠️ Scripts

| Command                  | Action                       |
| ------------------------ | --------------------------- |
| `npm run dev`            | Start dev server             |
| `npm run build`          | Transpile TS                 |
| `npm run start`          | Run built server             |
| `npm run test`           | Run Vitest                   |
| `npm run prisma:generate`| Generate Prisma client       |
| `docker:build`           | Build Docker image           |
| `docker:run`             | Run container                |
| `docker-compose up`      | Local stack + SQLite         |

---

## 🧪 Testing

- Unit/E2E with Vitest—see: `src/modules/orgs/orgs.spec.ts`, `src/modules/pets/pets.test.ts`.

---

## 🍃 Environment

Duplicate `.env.example` as `.env`

```ini
DATABASE_URL=...
JWT_SECRET=...
PORT=3000
NODE_ENV=development
```

---

## 🔒 License

MIT — see [LICENSE](api/LICENSE).

---

## 📁 Files & Configs

- All sources: `/api/src`
- Prisma schema: `/api/prisma/schema.prisma`
- Seed DB: `/api/prisma/seed.ts`
- Tests/utilities: `/api/test`

---

## 📞 Contact
<p>
  <a href="https://www.linkedin.com/in/pedro-solozabal/" target="_blank">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="https://github.com/solozabal" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-121212?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
  <a href="https://t.me/pedrosolozabal" target="_blank">
    <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
  </a>
</p>