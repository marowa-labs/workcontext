# ScholarForge AI 🎓

> **Turn Academic Overwhelm into Actionable Insights**

An open-source, AI-powered academic research and writing platform for students, researchers, and academics. Discover papers, manage citations, write collaboratively, and export publication-ready documents — all in one place.

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

---

## ✨ Features

- **AI Research Co-Pilot** — Context-aware writing assistance, autocomplete, and literature gap analysis powered by Claude, GPT-4o, and Gemini
- **250M+ Paper Discovery** — Search across CrossRef, OpenAlex, arXiv, and PubMed with advanced filters
- **Smart Citation Management** — APA, MLA, Chicago, and more — with confidence scoring and hallucination checks
- **Real-time Collaboration** — Live multi-user editing powered by Yjs/CRDT (like Google Docs, for research)
- **Multi-format Export** — PDF, DOCX, LaTeX, RTF, and more — including journal-ready formats
- **Workspace & Task Management** — Organize projects, assign tasks, and track progress with your team
- **Team Chat** — Built-in threaded discussions per project
- **Version Control & Backups** — Automatic history with one-click restore
- **Multi-Factor Authentication** — Email OTP, SMS OTP, and Google OAuth

---

## 🛠️ Tech Stack

| Layer          | Technology                                                 |
| -------------- | ---------------------------------------------------------- |
| Frontend       | Next.js 16, TypeScript, Tailwind CSS, TipTap Editor        |
| Backend        | Node.js, Express.js, TypeScript                            |
| Database       | PostgreSQL 17 + pgvector, Prisma ORM                       |
| Auth & Storage | Supabase                                                   |
| Real-time      | Hocuspocus + Yjs (CRDT)                                    |
| AI Providers   | Anthropic Claude, OpenAI GPT-4o, Google Gemini, OpenRouter |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local database)
- A Supabase account (free tier works)
- At least one AI provider API key (OpenAI, Anthropic, or Gemini)

### 1. Clone the Repository

```bash
git clone https://github.com/marowa-craig/scholarforge-ai.git
cd scholarforge-ai
```

### 2. Start the Local Database

```bash
docker-compose up -d
```

This spins up PostgreSQL 17 with the pgvector extension locally.

### 3. Set Up the Backend

```bash
cd backend
cp .env.example .env
# Fill in your environment variables (see below)
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 4. Set Up the Frontend

```bash
cd frontend
cp .env.example .env
# Fill in your Supabase and backend URL
npm install
npm run dev
```

The app will be running at `http://localhost:3000`.

---

## ⚙️ Environment Variables

### Backend `.env`

```env
DATABASE_URL=postgresql://postgres:password@localhost:5435/scholarforge
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key          # optional
ANTHROPIC_API_KEY=your_anthropic_key    # optional
GEMINI_API_KEY=your_gemini_key          # optional
RESEND_API_KEY=your_resend_key          # for emails
```

> You only need **one** AI provider key to get started.

### Frontend `.env`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

---

## 🤖 AI Provider Fallback System

ScholarForge uses an intelligent fallback chain so the app works even if one provider is down:

```
Request → Claude (Primary) → Gemini → GPT-4o → OpenRouter (Free)
```

You can configure which providers are active via your environment variables.

---

## 📁 Project Structure

```
scholarforge-ai/
├── backend/
│   ├── src/
│   │   ├── api/           # REST API route handlers
│   │   ├── services/      # Core business logic
│   │   ├── middleware/    # Auth & validation
│   │   └── hybrid/        # WebSocket & server setup
│   └── prisma/
│       └── schema.prisma  # Database schema (70+ models)
├── frontend/
│   ├── app/
│   │   ├── (auth)/        # Login, signup pages
│   │   ├── (dashboard)/   # Protected app routes
│   │   └── components/    # Reusable UI components
└── docker-compose.yml
```

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Browser extension for paper capture
- [ ] Zotero / Mendeley import
- [ ] Offline mode improvements
- [ ] Self-hosted deployment guide (Docker)
- [ ] Plugin/extension system

Have an idea? [Open a feature request →](https://github.com/marowa-craig/scholarforge-ai/issues)

---

## 🤝 Contributing

Contributions are what make open source amazing. All contributions are welcome — bug fixes, features, documentation, or translations.

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for full guidelines.

### Good First Issues

New to the codebase? Look for issues tagged [`good first issue`](https://github.com/marowa-craig/scholarforge-ai/issues?q=label%3A%22good+first+issue%22) — these are beginner-friendly and well-scoped.

---

## 🐛 Reporting Issues

Found a bug or have a suggestion? [Open an issue](https://github.com/marowa-craig/scholarforge-ai/issues/new) and include:

- What you expected to happen
- What actually happened
- Steps to reproduce
- Your OS and Node.js version

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

You are free to use, modify, and distribute this software — even commercially.

---

## 🙏 Acknowledgements

Built with love using:

- [Anthropic Claude](https://anthropic.com) — AI backbone
- [Supabase](https://supabase.com) — Auth and storage
- [TipTap](https://tiptap.dev) — Rich text editor
- [Hocuspocus](https://hocuspocus.dev) — Real-time collaboration
- [OpenAlex](https://openalex.org) — Open academic paper index

---

## 📬 Contact

Built by **Craig** — Bioinformatics student, builder, and open-source contributor.

- GitHub: [marowa-craig](https://github.com/marowa-craig)
- LinkedIn: [Craig Marowa](https://linkedin.com/in/craig-marowa-1b2132332)
- X/Twitter: [@craigmarowa](https://x.com/craigmarowa)

If ScholarForge has helped your research, consider giving it a ⭐ on GitHub — it helps more researchers find the project!
