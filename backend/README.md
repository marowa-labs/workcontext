# WorkContext Backend

Node.js/Express backend for the WorkContext collaborative writing platform.

## Tech Stack

- Node.js 18+ with Express
- TypeScript
- Prisma ORM (PostgreSQL + pgvector)
- WebSocket (Hocuspocus + Socket.io)
- Multi-provider AI integration (OpenAI, Anthropic, Google, Mistral, Perplexity)
- Plunk for email notifications

## Project Structure

```
src/
├── api/                    # API route handlers
│   ├── ai/                 # AI chat, completions, synthesis, document analysis
│   │   ├── route.ts        # Main AI endpoints (process, complete, analyze)
│   │   ├── chat-route.ts   # AI chat with context retrieval
│   │   ├── chat/route.ts   # AI chat endpoint (alternative)
│   │   └── synthesis-route.ts  # Cross-app document synthesis
│   ├── auth/               # Authentication (register, login, SSO)
│   ├── collaboration/      # Comments, real-time editing collaboration
│   ├── editor/             # Document version history
│   ├── integrations/       # External tool connections, OAuth, browse, import, search
│   │   ├── index.ts        # CRUD + OAuth flows + browse + import
│   │   ├── callback/route.ts   # OAuth callback handlers
│   │   └── search/route.ts     # Cross-source semantic search
│   ├── memory/             # Memory Layer (transcripts, decisions, activity, summaries)
│   │   └── route.ts        # All memory endpoints
│   ├── projects/           # Project CRUD, sharing, permissions
│   ├── roles/              # RBAC roles and permissions management
│   │   └── route.ts        # Role CRUD, permission assignment, member queries
│   ├── search/             # Global search (internal + external tools)
│   └── templates/          # Document templates
├── hybrid/
│   ├── main-server.ts      # Main Express server + route registration
│   └── websockets/
│       ├── hocuspocus-server.ts  # Real-time collaborative editing (Yjs/CRDT)
│       └── notification-server.ts # WebSocket notifications (Socket.io)
├── middleware/
│   ├── auth.ts             # JWT authentication + authorization
│   └── rbac.ts             # Role-based access control middleware
└── services/
    ├── integrations/       # Connector framework for external tools
    │   ├── connectorBase.ts       # Abstract base class (OAuth, sync, search, embeddings)
    │   ├── connectorRegistry.ts   # Central registry for all connectors
    │   ├── slackConnector.ts      # Slack OAuth2 + channels/messages sync
    │   ├── notionConnector.ts     # Notion OAuth2 + pages/databases/blocks sync
    │   ├── jiraConnector.ts       # Atlassian OAuth2 + issues sync
    │   ├── githubConnector.ts     # GitHub OAuth App + repos/issues/PRs sync
    │   ├── githubAppConnector.ts  # GitHub App (JWT + installation tokens)
    │   ├── figmaConnector.ts      # Figma OAuth2 + files/pages sync
    │   ├── importService.ts       # Content import (browse + convert to Project)
    │   └── searchAggregator.ts    # Unified cross-source semantic search
    ├── aiService.ts                # Core AI orchestration, provider routing, streaming
    ├── unifiedAIService.ts         # Unified interface across all AI providers
    ├── byokService.ts              # Bring-Your-Own-Key management
    ├── contextEmbeddingService.ts  # Semantic search via embeddings + pgvector
    ├── embeddingService.ts         # OpenAI embedding generation
    ├── searchService.ts            # Full-text + semantic search, research topics
    ├── editorService.ts            # Document editing, comments, collaboration logs
    ├── workspaceTaskService.ts     # Task management within workspaces
    ├── projectService.ts           # Project management, citations
    ├── projectServiceEnhanced.ts   # Enhanced project operations
    ├── projectSettingsService.ts   # Per-project user settings
    ├── storageService.ts           # File upload/download, storage quotas
    ├── exportHelper.ts             # Document export (DOCX, PDF, HTML)
    ├── notificationService.ts      # Email + in-app notifications
    ├── feedbackService.ts          # User feedback, audit logging
    ├── complianceService.ts        # Compliance checks, research verification
    ├── oauthService.ts             # OAuth/SSO for institutional accounts
    ├── RecurringTaskService.ts     # Recurring task scheduling
    ├── meetingTranscriptService.ts # Meeting transcript processing + AI extraction
    ├── decisionService.ts          # Decision/action item/blocker tracking
    ├── activityFeedService.ts      # Centralized activity feed
    ├── autoSummaryService.ts       # AI-powered summary generation
    ├── permissionService.ts        # RBAC permission checking + management
    └── roleService.ts              # RBAC role CRUD + member assignment
```

## Key Services

### Integration Framework (`services/integrations/`)

The connector framework provides a generic OAuth2 flow, content sync, and semantic search for 6 external tools:

| Connector | Auth Flow | Synced Content | Rate Limits |
|-----------|-----------|---------------|-------------|
| Slack | OAuth2 (user token) | Messages, channels, threads | Tier 3 (50/min) |
| Notion | OAuth2 | Pages, databases, blocks | 3 req/s |
| Jira | OAuth2 (Atlassian) | Issues, comments, projects | Varies by plan |
| GitHub OAuth | OAuth2 (user) | Repos, issues, PRs, READMEs | 5,000/hr |
| GitHub App | JWT + installation tokens | Repos, issues, PRs, READMEs | 15,000/hr |
| Figma | OAuth2 (personal access) | Files, pages, components | Varies |

Each connector extends `ConnectorBase` and implements:
- `authenticate(code, redirectUri)` — Exchange OAuth code for tokens
- `testConnection()` — Verify tokens are valid
- `syncContent(connection)` — Fetch and store content with embeddings
- `searchContent(query, workspaceId)` — Vector similarity search

### AI Synthesis (`api/ai/synthesis-route.ts`)

Generates documents from multiple connected tools:
- **PRD** — Product Requirements Document
- **Status Update** — Project status with accomplishments/blockers
- **Handoff** — Team handoff document
- **Summary** — Concise key points
- **Action Items** — Extracted with ownership and priority

### Memory Layer (`services/meetingTranscriptService.ts`, `decisionService.ts`, etc.)

| Service | Purpose |
|---------|---------|
| MeetingTranscriptService | Upload, parse, AI-analyze transcripts (Zoom, Otter, Teams) |
| DecisionService | CRUD for decisions, action items, blockers with status tracking |
| ActivityFeedService | Centralized activity timeline across all tools |
| AutoSummaryService | AI-powered daily/weekly/project summaries |

### RBAC (`services/permissionService.ts`, `middleware/rbac.ts`)

| Component | Purpose |
|-----------|---------|
| PermissionService | Seed defaults, check/grant/revoke 30+ granular permissions |
| RoleService | CRUD for roles, workspace initialization, member assignment |
| rbac middleware | `requirePermission()`, `requireRole()`, `requireOwnership()` |

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/workcontext

# Server
PORT=3001
NODE_ENV=development

# Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
JWT_SECRET=your-jwt-secret

# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
MISTRAL_API_KEY=...
OPENROUTER_API_KEY=...

# Email
PLUNK_API_KEY=...

# Encryption
ENCRYPTION_MASTER_KEY=your-encryption-key

# Integrations (optional)
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
JIRA_CLIENT_ID=
JIRA_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_CLIENT_ID=
GITHUB_APP_CLIENT_SECRET=
GITHUB_APP_SLUG=
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=

# CORS
ALLOWED_ORIGINS=http://localhost:3000
```

## Getting Started

```bash
npm install
cp .env.example .env
# Configure your environment variables
npx prisma generate
npx prisma db push
npm run dev          # Starts on http://localhost:3001
```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/sso` — SSO callback
- `GET /api/auth/user` — Get current user
- `POST /api/auth/logout` — Logout

### AI
- `POST /api/ai/chat` — AI chat with external tool context
- `POST /api/ai/synthesize` — Cross-app document synthesis
- `POST /api/ai/analyze` — Document analysis
- `POST /api/ai/completions` — Text completions
- `POST /api/ai/process` — AI request processing

### Integrations
- `GET /api/integrations` — List connected tools
- `POST /api/integrations` — Start OAuth flow (returns authorization URL)
- `GET /api/integrations/callback` — OAuth callback
- `POST /api/integrations/github/installation/callback` — GitHub App installation callback
- `POST /api/integrations/:id/sync` — Trigger content sync
- `DELETE /api/integrations/:id` — Disconnect tool
- `GET /api/integrations/browse` — Browse synced content from a connection
- `POST /api/integrations/import` — Import content as a new Project
- `POST /api/integrations/search` — Cross-source semantic search
- `GET /api/integrations/available` — List all available tool types

### Memory
- `POST /api/memory/transcripts` — Upload transcript
- `GET /api/memory/transcripts` — List transcripts
- `GET /api/memory/transcripts/:id` — Get transcript
- `DELETE /api/memory/transcripts/:id` — Delete transcript
- `POST /api/memory/transcripts/:id/analyze` — AI-analyze transcript
- `POST /api/memory/decisions` — Create decision/action item
- `GET /api/memory/decisions` — List decisions
- `GET /api/memory/decisions/:id` — Get decision
- `PUT /api/memory/decisions/:id` — Update decision
- `DELETE /api/memory/decisions/:id` — Delete decision
- `GET /api/memory/decisions/stats/overview` — Decision statistics
- `GET /api/memory/activity` — Activity feed
- `GET /api/memory/activity/stats` — Activity statistics
- `POST /api/memory/summaries/generate` — Generate AI summary
- `GET /api/memory/summaries` — List summaries
- `GET /api/memory/summaries/:id` — Get summary
- `PUT /api/memory/summaries/:id/pin` — Toggle pin
- `DELETE /api/memory/summaries/:id` — Delete summary

### RBAC
- `GET /api/roles` — List all roles with permissions
- `POST /api/roles` — Create custom role
- `POST /api/roles/seed` — Seed default roles and permissions
- `GET /api/roles/:id` — Get role details
- `PUT /api/roles/:id` — Update role
- `DELETE /api/roles/:id` — Delete custom role
- `POST /api/roles/:id/assign/:memberId` — Assign role to member
- `GET /api/roles/:id/members` — List members with role
- `GET /api/roles/permissions/all` — List all available permissions
- `GET /api/roles/permissions/my` — Get current user's permissions

### Other
- `GET/POST /api/projects` — Project management
- `GET/POST /api/templates` — Document templates
- `POST /api/search` — Global search (8 sources including integrations)
- `GET/POST /api/workspaces` — Workspace management

## Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm start                # Start production server
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Push schema to database
npx prisma migrate dev   # Create migration
npx tsc --noEmit         # Type-check without emitting
```

## License

MIT
