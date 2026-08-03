# WorkContext Frontend

Next.js 14 frontend for the WorkContext collaborative writing platform.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- TipTap (rich-text editor)
- BlockNote (block-based editor, Notion-like)
- Supabase Auth

## Project Structure

```
app/
├── (auth)/                     # Authentication pages
│   ├── login/
│   └── register/
├── (dashboard)/                # Main dashboard (requires auth)
│   ├── layout.tsx              # Dashboard layout with sidebar
│   ├── dashboard/
│   │   └── workspace/
│   │       └── [workspaceId]/
│   │           └── projects/page.tsx  # Workspace project list
│   ├── projects/page.tsx       # All projects list
│   └── settings/layout.tsx     # Settings layout
├── (marketing)/                # Public marketing pages
│   └── page.tsx                # Landing page
├── (standalone)/               # Standalone pages (no dashboard)
│   └── editor/[projectId]/page.tsx
├── pages/
│   └── dashboard/
│       ├── editor/
│       │   └── [projectId]/page.tsx  # Main editor page (dual tabs)
│       ├── projects/
│       │   └── list.tsx         # Projects list page
│       ├── memory/
│       │   └── page.tsx         # Memory Layer page (4 tabs)
│       ├── settings/
│       │   ├── integrations/
│       │   │   └── page.tsx     # Integration settings
│       │   └── RolesPermissions.tsx  # RBAC settings
│       └── workspace/
│           └── [workspaceId]/
│               └── projects/
│                   └── page.tsx  # Workspace projects
├── components/
│   ├── ai-chat/
│   │   └── AIChat.tsx           # AI chat with source citations + synthesis mode
│   ├── editor/
│   │   ├── main-editor.tsx      # TipTap collaborative editor
│   │   ├── BlockEditor.tsx      # BlockNote block-based editor (NEW)
│   │   ├── DocumentImportModal.tsx  # Import from files, tools, templates
│   │   ├── InlineAIAutocompleteSuggestion.tsx  # AI autocomplete suggestions
│   │   ├── AIAutocompleteExtension.ts  # TipTap AI autocomplete extension
│   │   └── AIAutocompleteSuggestion.js
│   ├── mentions/
│   │   ├── useMentions.tsx      # @ mention hook (internal + external tools)
│   │   └── MentionSuggestionList.tsx  # Mention picker with source badges
│   ├── dashboard/
│   │   ├── DashboardLayout.tsx   # Dashboard sidebar + layout
│   │   ├── SearchModal.tsx       # Global search (8 sources including integrations)
│   │   └── EnhancedDashboard.tsx
│   ├── integrations/             # Integration components
│   ├── memory/                   # Memory layer components
│   ├── projects/                 # Project management components
│   ├── research/
│   │   └── ChatModeSelector.tsx  # AI chat mode selector (General/Research/Autocomplete/Synthesize)
│   └── settings/
│       └── SettingsLayout.tsx    # Settings sidebar navigation
├── contexts/
│   ├── AuthContext.tsx            # Authentication state
│   ├── ThemeContext.tsx           # Theme (light/dark)
│   └── WebSocketContext.tsx       # WebSocket connection
└── lib/
    └── utils/
        └── aiService.js          # AI service utilities
```

## Key Features

### Dual-Mode Editor (TipTap + BlockNote)

The editor page (`/dashboard/editor/[projectId]`) supports two tabs:

| Tab | Editor | Use Case |
|-----|--------|----------|
| **Editor** | TipTap | New documents, imported .docx, manual content |
| **Blocks** | BlockNote | Imported Notion pages, Jira issues, structured content |

Content format is auto-detected on import:
- Notion pages, Jira issues → Blocks tab (block-structured content)
- Slack messages, GitHub READMEs, Figma files → Editor tab (linear content)

### AI Chat with External Context

The AI chat (`AIChat.tsx`) includes:
- **4 modes:** General, Research, Autocomplete, Synthesize
- **Source citations:** AI responses show tool-specific badges (`Slack / #proj-beta`, `Jira / PROJ-123`)
- **Cross-app synthesis:** Generate PRDs, status updates, handoff docs from connected tools
- **External context:** AI searches connected tools alongside internal workspace data

### Global Search

The search modal (`SearchModal.tsx`) queries 8 sources in parallel:
1. Workspaces
2. Projects
3. Tasks
4. Members
5. Chat Sessions
6. Chat Messages
7. PDF Documents
8. **External Tools** (Slack, Notion, Jira, GitHub, Figma)

Results show source badges and deep links to original sources.

### @ Mentions

The mention system (`useMentions.tsx` + `MentionSuggestionList.tsx`) supports:
- **5 entity types:** People, Pages, Spaces, Tasks, Connected Tools
- **External tool mentions:** `@Slack:#channel`, `@Jira:PROJ-123`, `@GitHub:org/repo#42`
- **Source badges:** Each external mention shows a clickable link to the original source

### Integration Settings

The Integrations page (`/settings/integrations`) provides:
- **Universal Search:** Semantic search across all connected tools
- **Connected Tools:** Status, sync, disconnect
- **Available Integrations:** One-click OAuth connect for 6 tools

### Memory Layer

The Memory page (`/dashboard/memory`) has 4 tabs:
- **Decisions:** Track decisions, action items, blockers with status management
- **Activity:** Timeline of all workspace and connected tool activity
- **Summaries:** AI-generated daily/weekly/project summaries (pinnable)
- **Transcripts:** Upload and AI-analyze meeting transcripts

### RBAC Settings

The Roles & Permissions page (`/settings/roles`) provides:
- **Role List:** View all roles with permission previews and member counts
- **Permission Editor:** Expandable resource groups with granular permission checkboxes
- **Custom Roles:** Create, edit, delete custom roles
- **System Role Protection:** Lock icons, no delete for system roles

## Components

### Editor Components

| Component | Purpose |
|-----------|---------|
| `main-editor.tsx` | TipTap editor with collaboration, mentions, AI menu, footnotes, math, citations |
| `BlockEditor.tsx` | BlockNote editor with drag handles, slash commands, nested blocks |
| `DocumentImportModal.tsx` | Import from local files, connected tools, or templates |
| `InlineAIAutocompleteSuggestion.tsx` | Inline AI writing suggestion bar (Tab to accept, Esc to dismiss) |
| `AIAutocompleteExtension.ts` | TipTap extension for AI autocomplete triggers |

### AI Components

| Component | Purpose |
|-----------|---------|
| `AIChat.tsx` | Full AI chat interface with 4 modes, source citations, synthesis |
| `ChatModeSelector.tsx` | Mode selector (General/Research/Autocomplete/Synthesize) |

### Dashboard Components

| Component | Purpose |
|-----------|---------|
| `DashboardLayout.tsx` | Sidebar navigation with all pages |
| `SearchModal.tsx` | Global search across 8 sources with filter tabs |
| `EnhancedDashboard.tsx` | Dashboard overview |

### Mentions

| Component | Purpose |
|-----------|---------|
| `useMentions.tsx` | React hook for @ mentions (internal + external) |
| `MentionSuggestionList.tsx` | Mention picker with 5 entity types and source badges |

## Dependencies

```json
{
  "@blocknote/core": "^0.52.1",
  "@blocknote/mantine": "^0.52.1",
  "@blocknote/react": "^0.52.1",
  "@blocknote/shadcn": "^0.52.1",
  "@tiptap/...": "various TipTap extensions",
  "next": "^14.0.0",
  "react": "^18.0.0",
  "@supabase/supabase-js": "^2.0.0"
}
```

## Getting Started

```bash
npm install
cp .env.example .env
# Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_API_URL
npm run dev          # Starts on http://localhost:3000
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Pages

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/dashboard` | Main dashboard |
| `/dashboard/projects` | All projects |
| `/dashboard/workspace/[id]` | Workspace detail |
| `/dashboard/workspace/[id]/projects` | Workspace projects |
| `/dashboard/editor/[projectId]` | Editor (dual tabs) |
| `/dashboard/memory` | Memory Layer (4 tabs) |
| `/dashboard/tasks` | Task management |
| `/dashboard/templates` | Template library |
| `/settings/integrations` | Integration settings |
| `/settings/roles` | Roles & Permissions |

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx tsc --noEmit     # Type-check without emitting
```

## License

MIT
