# WorkContext

An AI-powered collaborative writing and research workspace that connects your team's context across all tools — Slack, Notion, Jira, GitHub, and Figma — into a single searchable, actionable layer.

## Key Features

### 1. Universal Cross-Tool Semantic Search

One-click integrations with Slack, Notion, Jira, GitHub (OAuth & App), and Figma. Search once and get answers from everywhere — the AI pulls relevant Slack threads, Jira tickets, GitHub issues, and Notion pages, linking directly to the source.

- **6 Connectors:** Slack, Notion, Jira, GitHub OAuth, GitHub App, Figma
- **Semantic Search:** Vector similarity search across all connected tools via pgvector
- **Deep Linking:** Every result links back to its original source
- **Import from Tools:** Browse and import content from connected tools directly into projects

### 2. Dynamic Context-Aware AI Copilot

An AI assistant that isn't just an LLM — it knows everything happening across your connected tools. Answers questions grounded in your team's real data with explicit source citations.

- **Multi-Provider AI:** OpenAI, Anthropic, Google, Mistral, Perplexity, and custom endpoints
- **Source-Grounded Answers:** Responses cite Slack threads, Jira tickets, GitHub issues, and Notion pages with `[1]`, `[2]` references
- **Cross-App Synthesis:** Generate PRDs, status updates, handoff docs, action items, and summaries by pulling context from multiple tools simultaneously
- **Working AI Autocomplete:** Inline writing suggestions in the editor powered by your company's data
- **BYOK (Bring Your Own Key):** Users can provide their own AI API keys

### 3. Automated Decision & Activity Feeds (Memory Layer)

Teams lose context because decisions are buried in chat logs. The Memory Layer captures everything — meeting transcripts, decisions, action items, and blockers — and organizes them automatically.

- **Meeting Transcript Upload:** Upload transcripts from Zoom, Otter, Teams, or manual entry; AI extracts decisions, action items, blockers, and key insights
- **Decision & Action Item Tracking:** Create, assign, and track decisions, action items, and blockers with status management and priority levels
- **Centralized Activity Feed:** Aggregated timeline of all activity across the workspace and connected tools
- **AI-Powered Summaries:** Generate daily, weekly, project, meeting, or custom summaries using AI — pin important ones

### 4. Collaborative Editor with Living Canvas

A dual-mode editor that meets you where you are. Use the traditional rich-text editor for new content, or switch to the block-based editor for imported Notion pages and structured content.

- **Dual Editor Tabs:** TipTap editor for standard documents + BlockNote editor for Notion-like blocks
- **Block Editor (Notion-like):** Drag handles, slash commands, nested blocks, checkboxes, toggles, code blocks — all built on BlockNote
- **Source-Aware Import:** Content imported from Notion, Jira, or other block-structured tools auto-opens in the Blocks tab
- **Real-Time Collaboration:** WebSocket-based collaborative editing via Hocuspocus + Yjs
- **Rich Formatting:** Headings, lists, code blocks, tables, images, math (KaTeX), footnotes, citations
- **Templates:** Reusable document templates with placeholder support
- **Version History:** Full document versioning with diff support

### 5. Enterprise-Grade RBAC

Granular role-based access control with permission mirroring — the AI respects source permissions. If User A doesn't have access to a restricted channel, the AI never surfaces that context.

- **Default Roles:** Owner, Admin, Editor, Viewer — each with pre-configured permissions
- **Custom Roles:** Create custom roles with granular permissions (projects.read, ai.access, members.manage, etc.)
- **Permission Mirroring:** AI context retrieval respects workspace membership and role-based access
- **Granular Permissions:** 30+ individual permissions across projects, tasks, AI, templates, members, and integrations

### 6. Additional Features

- **Research Management:** Track research topics, sources, and citations across projects
- **Workspace & Task Management:** Organize projects in workspaces with tasks, recurring tasks, and task comments
- **Notifications:** Real-time WebSocket notifications + email via Plunk
- **Export:** Export documents as Word, PDF, or HTML
- **Feedback & Audit:** In-app feedback collection with comprehensive audit logging
- **Semantic Search:** Vector-based search powered by OpenAI embeddings + pgvector
- **Institutional SSO:** OAuth-based institutional authentication for enterprise accounts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| **Editors** | TipTap (rich-text) + BlockNote (block-based) |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL via Prisma ORM |
| **Real-time** | WebSocket (Hocuspocus for collaborative editing), Socket.io (notifications) |
| **AI** | Multi-provider (OpenAI, Anthropic, Google, Mistral, Perplexity, custom endpoints) |
| **Embeddings** | OpenAI embeddings + pgvector for semantic search |
| **Auth** | JWT-based with SSO/Institutional support |
| **Email** | Plunk (migrated from other providers) |
| **Integrations** | Slack, Notion, Jira, GitHub (OAuth + App), Figma |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL with pgvector extension
- Plunk account for email notifications

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd workcontext

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure your database and API keys in .env
npx prisma generate
npx prisma db push
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
# Configure your Supabase and API settings in .env
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/workcontext

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers — BYOK (Bring Your Own Key)
# Users configure their own AI API keys via Settings > AI API Keys.
# The backend does NOT use any AI keys from this file.
# AI features will not work until each user adds their own key.

# Plunk (email)
PLUNK_API_KEY=...

# Integration OAuth Keys (optional)
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
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=
```

### Initial Setup

After starting the server, initialize the database with default roles and permissions:

```bash
curl -X POST http://localhost:3001/api/roles/seed
```

## Project Structure

```
workcontext/
├── backend/
│   └── src/
│       ├── api/                    # API route handlers
│       │   ├── ai/                 # AI chat, completions, synthesis
│       │   ├── auth/               # Authentication
│       │   ├── collaboration/      # Comments, real-time editing
│       │   ├── editor/             # Version history
│       │   ├── integrations/       # OAuth connections, browse, import, search
│       │   ├── memory/             # Transcripts, decisions, activity, summaries
│       │   ├── projects/           # Project CRUD
│       │   ├── roles/              # RBAC roles and permissions
│       │   ├── search/             # Global search
│       │   └── templates/          # Document templates
│       ├── hybrid/
│       │   ├── main-server.ts      # Express server + route registration
│       │   └── websockets/         # Hocuspocus + notification servers
│       ├── middleware/
│       │   ├── auth.ts             # JWT authentication
│       │   └── rbac.ts             # Role-based access control
│       └── services/
│           ├── integrations/       # Connector framework
│           │   ├── connectorBase.ts
│           │   ├── connectorRegistry.ts
│           │   ├── slackConnector.ts
│           │   ├── notionConnector.ts
│           │   ├── jiraConnector.ts
│           │   ├── githubConnector.ts
│           │   ├── githubAppConnector.ts
│           │   ├── figmaConnector.ts
│           │   ├── importService.ts
│           │   └── searchAggregator.ts
│           ├── aiService.ts        # Core AI orchestration
│           ├── unifiedAIService.ts  # Multi-provider AI interface
│           ├── byokService.ts      # Bring-Your-Own-Key management
│           ├── contextEmbeddingService.ts  # Semantic search
│           ├── meetingTranscriptService.ts # Transcript processing
│           ├── decisionService.ts  # Decision tracking
│           ├── activityFeedService.ts      # Activity feed
│           ├── autoSummaryService.ts       # AI summaries
│           ├── permissionService.ts        # RBAC permissions
│           ├── roleService.ts              # RBAC roles
│           └── ...                 # Other services
├── frontend/
│   └── app/
│       ├── components/
│       │   ├── ai-chat/            # AI chat interface
│       │   ├── editor/             # TipTap + BlockNote editors
│       │   ├── mentions/           # @ mention system
│       │   ├── memory/             # Memory layer components
│       │   └── integrations/       # Integration components
│       ├── contexts/               # React contexts
│       └── pages/dashboard/
│           ├── memory/             # Memory layer page
│           ├── settings/
│           │   ├── integrations/   # Integration settings
│           │   └── RolesPermissions.tsx  # RBAC settings
│           └── projects/           # Project management
└── prisma/
    └── schema.prisma               # Database schema (60+ models)
```

## Development

### Backend

```bash
cd backend
npm run dev          # Start development server on port 3001
npx tsc --noEmit     # Type-check without emitting
```

### Frontend

```bash
cd frontend
npm run dev          # Start development server on port 3000
```

### Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/sso` - SSO callback
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout

### AI
- `POST /api/ai/chat` - AI chat (with external tool context)
- `POST /api/ai/synthesize` - Cross-app document synthesis
- `POST /api/ai/analyze` - Document analysis
- `POST /api/ai/completions` - Text completions

### Integrations
- `GET /api/integrations` - List connected tools
- `POST /api/integrations` - Start OAuth flow
- `GET /api/integrations/callback` - OAuth callback
- `POST /api/integrations/:id/sync` - Trigger content sync
- `DELETE /api/integrations/:id` - Disconnect tool
- `GET /api/integrations/browse` - Browse synced content
- `POST /api/integrations/import` - Import content as project
- `POST /api/integrations/search` - Cross-source semantic search

### Memory
- `POST /api/memory/transcripts` - Upload transcript
- `POST /api/memory/transcripts/:id/analyze` - AI-analyze transcript
- `GET /api/memory/decisions` - List decisions
- `POST /api/memory/decisions` - Create decision
- `GET /api/memory/activity` - Activity feed
- `POST /api/memory/summaries/generate` - Generate AI summary

### RBAC
- `GET /api/roles` - List roles
- `POST /api/roles` - Create custom role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete custom role
- `POST /api/roles/:id/assign/:memberId` - Assign role
- `GET /api/roles/permissions/all` - List all permissions
- `GET /api/roles/permissions/my` - My permissions

### Other
- `GET/POST /api/projects` - Project management
- `GET/POST /api/templates` - Document templates
- `POST /api/search` - Global search (includes connected tools)
- `GET/POST /api/workspaces` - Workspace management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For questions or feedback, please open an issue or contact the development team.
