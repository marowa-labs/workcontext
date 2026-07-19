<p align="center">
  <img src="https://img.shields.io/badge/WorkContext-Backend-7C3AED?style=for-the-badge&logo=node.js&logoColor=white" alt="WorkContext Backend" width="380">
</p>

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express"></a>
  <a href="https://www.prisma.io/"><img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma"></a>
  <a href="https://www.postgresql.org/"><img src="https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
</p>

# WorkContext — Backend

> **The engine room: an Express + TypeScript API that powers AI, real-time collaboration, tasks, and secure Bring-Your-Own-Key routing for WorkContext.**

This package is the **backend** of WorkContext. It exposes the REST API and WebSocket servers consumed by the [frontend](../frontend), persists data in PostgreSQL via Prisma, authenticates through Supabase, and routes every AI request to the user's own provider key (BYOK) — with AES-256-GCM encrypted storage.

---

## 📌 Table of Contents

- [What It Does](#-what-it-does)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [AI & BYOK Flow](#-ai--byok-flow)
- [Getting Started](#-getting-started)
- [Environment](#-environment)
- [Scripts](#-scripts)
- [Deployment](#-deployment)
- [License](#-license)

---

## ⚙️ What It Does

- **REST API** — workspaces, projects, tasks, documents, citations, billing, analytics.
- **AI Service** — context-aware writing, grammar, research, summarization, chat (streaming), and RAG over workspace content.
- **BYOK & secure key vault** — per-user API keys for Google, OpenAI, Anthropic, OpenRouter, encrypted with AES-256-GCM; keys are only decrypted server-side at request time.
- **Real-time** — Hocuspocus/Yjs collaboration server + a notification WebSocket server.
- **Auth** — email OTP, SMS OTP, Google OAuth, and MFA, delegated to Supabase.

---

## 🛠️ Tech Stack

| Concern | Technology |
| ------- | ---------- |
| Runtime | Node.js 20+ · Express 5 · TypeScript |
| ORM / DB | Prisma 7 · PostgreSQL 17 + pgvector |
| Auth | Supabase Auth |
| Realtime | Hocuspocus 3 · Yjs (CRDT) |
| AI SDKs | `@google/generative-ai` · `openai` · `@anthropic-ai/sdk` · `@openrouter/sdk` |
| Security | AES-256-GCM encryption · rate limiting · CORS (credential-aware) |

---

## 📁 Project Structure

```text
backend/
├── src/
│   ├── api/              # Route handlers (ai, auth, projects, tasks, billing…)
│   ├── services/         # Business logic (aiService, byokService, encryptionService…)
│   ├── hybrid/           # main-server.ts + websockets + supabase auth
│   ├── middleware/       # Auth & validation
│   ├── monitoring/       # Logging, metrics, AI performance
│   ├── scheduledTasks/   # Cleanup, embeddings refresh, reminders
│   └── lib/              # Prisma client & shared utils
├── prisma/              # schema.prisma + migrations
├── supabase/functions/  # Edge functions (e.g. OTP verification)
├── tests/               # Unit tests (e.g. aiRouting.test.ts)
└── scripts/             # Maintenance scripts
```

---

## 🔑 AI & BYOK Flow

Every AI request is routed to the user's own provider key. There is **no system AI key fallback** in the request path — if a user hasn't configured a key (and enabled it), the request returns a clear "API key not configured" message.

```mermaid
sequenceDiagram
    participant U as User (Frontend)
    participant API as Backend (Express)
    participant BYOK as BYOKService
    participant P as AI Provider (BYOK key)

    U->>API: POST /api/ai/process (model: openai/gpt-4o-mini)
    API->>BYOK: getDecryptedKey(userId, "openai")
    BYOK-->>API: decrypted key (only if byok_enabled = true)
    API->>P: authorized request with user's key
    P-->>API: streamed completion
    API-->>U: streamed response
```

Key points:
- Keys are validated (format + live test) **before** they are stored.
- Saving a key auto-enables BYOK; deleting the last key disables it.
- CORS is credential-aware and allows the Vercel frontend (including preview deploys).

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 17 (local Docker or a hosted instance)
- Supabase project (URL, service-role key, JWT secret)
- At least one AI provider key for testing

### Install & Run

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL, SUPABASE_*, ENCRYPTION_MASTER_KEY (64 hex chars), and AI keys
npm install
npx prisma migrate dev
npm run dev                 # http://localhost:3001
```

---

## 🔐 Environment

Key variables (see `.env.example`):

```env
DATABASE_URL=postgresql://postgres:password@localhost:5435/workcontext
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_MASTER_KEY=0000...0000   # 64 hex chars — required for BYOK encryption
PORT=3001
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app,https://www.your-app.com
```

> `ENCRYPTION_MASTER_KEY` is mandatory. If it changes or rotates, previously encrypted keys become unreadable until re-saved.

---

## 📜 Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Run with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript (`tsc`) |
| `npm run start` | Start the compiled/server directly |
| `npm run lint` | ESLint |
| `npx tsx tests/aiRouting.test.ts` | Run AI routing + key-format unit tests |

---

## 🚢 Deployment

Built for **Render** (or any Node host). Set the env vars above, set the health-check path to `/` or `/health`, and point your Vercel frontend's `NEXT_PUBLIC_API_URL` (or the `/api` rewrite) at the deployed URL.

---

## 📄 License

MIT — see the [root LICENSE](../LICENSE).
