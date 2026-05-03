# ScholarForge AI - Comprehensive Codebase Analysis

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What is ScholarForge AI?](#what-is-scholarforge-ai)
3. [Architecture Overview](#architecture-overview)
4. [Technology Stack](#technology-stack)
5. [Core Features](#core-features)
6. [Backend Deep Dive](#backend-deep-dive)
7. [Frontend Deep Dive](#frontend-deep-dive)
8. [Database Schema](#database-schema)
9. [AI Integration](#ai-integration)
10. [Security & Authentication](#security--authentication)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Business Model & Monetization](#business-model--monetization)
13. [Development Workflow](#development-workflow)

---

## Executive Summary

**ScholarForge AI** is a comprehensive AI-powered academic research and writing platform designed for students, researchers, and academics. It combines advanced AI capabilities with collaborative tools to streamline the entire research workflow—from paper discovery to publication-ready documents.

**Key Value Proposition**: "Turn Academic Overwhelm into Actionable Insights" - The platform helps researchers discover, synthesize, and innovate with confidence using AI, while ensuring academic integrity through verified citations and hallucination-free outputs.

---

## What is ScholarForge AI?

### Primary Purpose

ScholarForge AI is an **AI Research Co-Pilot** that helps academics:

- Discover relevant research papers from a database of 250M+ papers
- Generate accurate summaries and identify research gaps
- Manage citations with confidence scoring
- Write collaboratively with real-time editing
- Export publication-ready documents in multiple formats

### Target Audience

- **PhD Candidates** - Thesis and dissertation writing
- **Graduate Students** - Research papers and literature reviews
- **Professors** - Publication management and collaboration
- **Research Teams** - Collaborative research projects

### Core Philosophy

1. **Accuracy & Ethics First** - Built-in citation verification and human-in-the-loop safeguards
2. **Focus on Writing** - Everything needed in one place
3. **Made for Collaboration** - Real-time editing, comments, and version control

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Web App    │  │  Mobile App  │  │  Desktop App │      │
│  │   (Next.js)  │  │  (Future)    │  │  (Future)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
│              (Express.js + Next.js Hybrid)                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AI Services │    │  Core APIs   │    │  Real-time   │
│  (Multiple   │    │  (RESTful)   │    │  (WebSocket) │
│  Providers)  │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Supabase   │  │   Vector DB  │      │
│  │  (Primary)   │  │  (Auth/     │  │  (pgvector)  │      │
│  │              │  │   Storage)   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
scholarforge-ai/
├── backend/                    # Express.js + Next.js hybrid server
│   ├── src/
│   │   ├── api/               # API route handlers
│   │   ├── services/          # Business logic services
│   │   ├── middleware/        # Auth & validation middleware
│   │   ├── hybrid/            # Hybrid server setup
│   │   ├── scheduledTasks/    # Cron jobs & scheduled tasks
│   │   └── monitoring/        # Logging & metrics
│   └── prisma/
│       └── schema.prisma      # Database schema definition
├── frontend/                   # Next.js frontend application
│   ├── app/
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── pages/             # Page components
│   │   ├── components/        # Reusable UI components
│   │   └── hooks/             # Custom React hooks
│   └── public/                # Static assets
└── docker-compose.yml         # Local development setup
```

---

## Technology Stack

### Backend Technologies

| Component | Technology       | Version       | Purpose          |
| --------- | ---------------- | ------------- | ---------------- |
| Runtime   | Node.js          | 20+           | Server runtime   |
| Framework | Express.js       | 5.2.1         | API server       |
| Framework | Next.js          | 16.1.6        | Hybrid rendering |
| Language  | TypeScript       | 5.x           | Type safety      |
| Database  | PostgreSQL       | 17 + pgvector | Primary database |
| ORM       | Prisma           | 7.7.0         | Database access  |
| Auth      | Supabase Auth    | 2.91.0        | Authentication   |
| Storage   | Supabase Storage | 2.91.0        | File storage     |
| Real-time | Hocuspocus/Yjs   | 3.4.4         | Collaboration    |
| AI/ML     | Multiple         | Various       | AI processing    |

### Frontend Technologies

| Component     | Technology      | Version | Purpose             |
| ------------- | --------------- | ------- | ------------------- |
| Framework     | Next.js         | 16.1.6  | React framework     |
| Language      | TypeScript      | 5.x     | Type safety         |
| Styling       | Tailwind CSS    | 4.x     | CSS framework       |
| UI Components | Radix UI        | 1.x     | Headless components |
| Editor        | TipTap          | 3.19.0  | Rich text editor    |
| Icons         | Lucide React    | 0.562.0 | Icon library        |
| Forms         | React Hook Form | 7.71.1  | Form management     |
| Validation    | Zod             | 4.3.5   | Schema validation   |

### AI/ML Providers

| Provider   | Models                             | Use Case          |
| ---------- | ---------------------------------- | ----------------- |
| Google     | Gemini 2.5 Flash                   | General AI tasks  |
| Google     | Gemini 2.5 Flash, Gemini 3.1 Flash | Multimodal tasks  |
| OpenRouter | Multiple free models               | Cost optimization |

---

## Core Features

### 1. AI Research Co-Pilot

**Location**: `backend/src/services/researchCoPilotService.ts`

Intelligent research assistance with:

- **Document Context Awareness** - Understands your entire document
- **Citation Suggestions** - Recommends relevant papers
- **Paper Recommendations** - Personalized based on research history
- **Literature Gap Analysis** - Identifies missing research areas
- **Plagiarism-Free Generation** - Original content creation

**Supported Modes**:

- `general` - General assistance
- `research` - Deep research mode
- `autocomplete` - Smart text completion

### 2. Intelligent Paper Discovery

**Location**: `backend/src/services/paperDiscoveryService.ts`

- Scans 250M+ academic papers
- Advanced filtering and sorting
- Safety classifications for source reliability
- CrossRef, OpenAlex, arXiv, PubMed integration

### 3. Citation Management System

**Location**: `backend/src/services/citationService.ts`

**Features**:

- Multiple citation styles (APA, MLA, Chicago, etc.)
- Automatic citation formatting via Citation.js
- Confidence scoring for citations
- Support for multiple source types:
  - Journal articles
  - Books
  - Conference papers
  - Websites
  - Theses/Dissertations
  - Reports

### 4. Smart Summarization

**Location**: `backend/src/services/aiService.ts`

- Multi-model verification for accuracy
- Research gap identification
- Consensus detection across papers
- Key finding extraction

### 5. Real-time Collaboration

**Location**: `backend/src/hybrid/websockets/hocuspocus-server.ts`

Powered by **Hocuspocus** (Yjs-based):

- Live multi-user editing
- Cursor presence indicators
- Conflict-free replicated data types (CRDT)
- Offline support

### 6. Document Export System

**Location**: `backend/src/services/exportService.ts`

**Supported Formats**:

- PDF (standard & journal-ready)
- DOCX (Microsoft Word)
- LaTeX (academic publications)
- TXT (plain text)
- RTF (rich text)
- XLSX/CSV (spreadsheets)
- PNG (images)
- ZIP (bundled exports)
- Overleaf integration
- Google Drive integration
- OneDrive integration

### 7. Workspace & Project Management

**Location**: `backend/src/api/workspaces/`

**Features**:

- Multiple workspaces per user
- Role-based access control (admin, editor, viewer)
- Team invitations
- Project organization
- Custom views and filters

### 8. Task Management

**Location**: `backend/src/services/workspaceTaskService.ts`

- Task creation and assignment
- Due dates and priorities
- Recurring tasks
- Subtasks and dependencies
- Time tracking
- Labels and custom fields
- Comments and attachments

### 9. Team Chat

**Location**: `backend/src/api/team-chat/`

- Workspace-based chat rooms
- Project-specific discussions
- Threaded conversations
- File sharing

### 10. Backup & Version Control

**Location**: `backend/src/services/`

- Automatic version history
- Scheduled backups
- One-click restore
- Version comparison
- Configurable retention periods

### 11. Notification System

**Location**: `backend/src/services/notificationService.ts`

**Channels**:

- In-app notifications
- Email notifications (Resend)
- Push notifications
- SMS notifications (Twilio)

**Categories**:

- Project activity
- Collaboration events
- AI feature completions
- Billing alerts
- Security notifications

### 12. Subscription & Billing

**Location**: `backend/src/services/subscriptionService.ts`

**Payment Provider**: LemonSqueezy

**Plans**:

- **Free** - 100MB storage, basic features
- **Student** - 5GB storage, advanced AI
- **Researcher** - 100GB storage, full features

---

## Backend Deep Dive

### API Structure

```
backend/src/api/
├── ai/                      # AI-related endpoints
│   ├── route.ts            # Main AI processing
│   ├── chat-route.ts       # Chat functionality
│   ├── research-copilot-route.ts
│   ├── search-route.ts
│   ├── grammar-route.ts
│   ├── summarization-route.ts
│   └── document-qa-route.ts
├── auth/                    # Authentication
├── billing/                 # Billing & subscriptions
├── citations/              # Citation management
├── editor/                 # Document editor
├── notifications/          # Notification system
├── projects/               # Project management
├── research/               # Research tools
├── workspaces/             # Workspace & tasks
│   ├── index.ts           # Workspace CRUD
│   ├── tasks/             # Task management
│   └── labels-route.ts    # Label management
└── webhooks/              # External service webhooks
```

### Key Services

#### 1. AIService (`aiService.ts`)

**Size**: 2,580 lines

**Capabilities**:

- Multi-provider AI handling (Google Gemini, OpenRouter)
- Usage tracking and rate limiting
- Cost estimation and monitoring
- Model selection based on task complexity
- Session-based autocomplete restrictions

**Supported Actions**:

- `improve` - Enhance writing quality
- `summarize` - Create concise summaries
- `expand` - Elaborate on ideas
- `paraphrase` - Reword content
- `grammar` - Grammar checking
- `academic_tone` - Adjust formality
- `generate_citation` - Create citations
- `brainstorm` - Idea generation

#### 2. EditorService (`editorService.ts`)

**Size**: 1,817 lines

**Features**:

- TipTap JSON content validation
- Document version management
- Word count tracking
- Table structure validation
- Content sanitization

#### 3. ExportService (`exportService.ts`)

**Size**: 1,898 lines

**Features**:

- 13+ export formats
- Citation inclusion
- Cover page generation
- Table of contents
- Journal-ready formatting

#### 4. CitationService (`citationService.ts`)

**Size**: 1,313 lines

**Features**:

- Citation CRUD operations
- CrossRef integration for DOI lookup
- BibTeX, RIS, CSL export
- Citation confidence scoring
- Plagiarism detection

### Scheduled Tasks

Located in `backend/src/scheduledTasks/`:

1. **cleanupExpiredItems.ts** - Removes expired data
2. **versionCleanupTask.ts** - Cleans old document versions
3. **checkSearchAlerts.ts** - Processes saved search alerts
4. **versionSchedulingTask.ts** - Automated version creation
5. **taskReminderTask.ts** - Sends task due reminders

---

## Frontend Deep Dive

### Application Structure

```
frontend/app/
├── (auth)/                  # Auth route group
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   └── verify-email/
├── (dashboard)/            # Protected route group
│   ├── dashboard/          # Main dashboard
│   ├── research/           # Research interface
│   ├── projects/           # Project management
│   ├── billing/            # Subscription management
│   └── settings/           # User settings
├── pages/                  # Page components
│   ├── marketing/          # Landing pages
│   ├── dashboard/          # Dashboard views
│   └── docs/              # Documentation
├── components/            # Reusable components
│   ├── ui/               # UI primitives
│   ├── editor/           # Editor components
│   └── research/         # Research components
├── hooks/                 # Custom React hooks
└── lib/                   # Utility functions
```

### Research Interface Components

Located in `frontend/app/research/`:

1. **ResearchInterface.tsx** - Main research UI
2. **ResearchMatrix.tsx** - Literature matrix view
3. **ResearchGraph.tsx** - Concept relationship graph
4. **PaperCard.tsx** - Paper display component
5. **PaperDetailsPanel.tsx** - Detailed paper view
6. **ResearchChatSidebar.tsx** - AI chat integration
7. **TimelineChart.tsx** - Research timeline visualization
8. **SynthesisCard.tsx** - Synthesis display
9. **ConceptNode.tsx** - Graph node component
10. **CitationModal.tsx** - Citation insertion

### Key Features

#### Rich Text Editor

**Technology**: TipTap + Yjs for collaboration

**Extensions**:

- Basic formatting (bold, italic, underline)
- Headings (H1-H6)
- Lists (ordered, unordered, task)
- Tables
- Blockquotes
- Code blocks
- Links and images
- Text alignment
- Subscript/superscript
- Highlighting
- Collaboration cursors
- Character counting

#### Theme System

**Technology**: Next Themes + Tailwind CSS

- Dark/Light mode support
- System preference detection
- Theme persistence

---

## Database Schema

### Core Models

The database schema (`backend/prisma/schema.prisma`) contains **70+ models**:

#### User Management

- `User` - Core user entity
- `UserSession` - Active sessions
- `LoginHistory` - Authentication audit
- `OTPCode` - Verification codes
- `NotificationSettings` - User preferences
- `UserAppearanceSettings` - UI preferences
- `UserPrivacySettings` - Privacy controls

#### Workspace & Collaboration

- `Workspace` - Team workspaces
- `WorkspaceMember` - Membership records
- `WorkspaceInvitation` - Pending invites
- `TeamChatMessage` - Chat messages
- `CollaboratorPresence` - Real-time presence

#### Project & Content

- `Project` - Research projects
- `DocumentVersion` - Version history
- `Citation` - Bibliographic entries
- `Note` - Research notes (multiple types)
- `PdfDocument` - Uploaded PDFs

#### Task Management

- `WorkspaceTask` - Task entities
- `WorkspaceSubtask` - Sub-tasks
- `TaskAssignee` - Assignment records
- `TaskComment` - Task discussions
- `TaskAttachment` - File attachments
- `TaskTimeEntry` - Time tracking
- `TaskDependency` - Task relationships
- `WorkspaceLabel` - Categorization
- `WorkspaceCustomField` - Custom attributes

#### AI & Research

- `AIChatSession` - Chat history
- `AIChatMessage` - Individual messages
- `AIUsage` - Usage tracking
- `AIHistory` - AI interaction history
- `AIFeedback` - User feedback
- `ResearchSource` - Research materials
- `ResearchTopic` - Topic tracking
- `SearchAlert` - Saved searches

#### Billing & Subscriptions

- `Subscription` - Subscription records
- `Invoice` - Billing invoices
- `PaymentMethod` - Saved payment methods
- `FailedWebhook` - Failed webhook tracking

#### System

- `Notification` - System notifications
- `Backup` - Backup records
- `Restore` - Restore operations
- `RecycledItem` - Soft-deleted items
- `AuditLog` - System audit trail

---

## AI Integration

### Multi-Provider Architecture

The platform uses a fallback system across multiple AI providers:

```
Request → Primary (Gemini) → Fallback 1 (OpenRouter)
```

### AI Models Available

| Model               | Provider   | Max Tokens | Best For       |
| ------------------- | ---------- | ---------- | -------------- |
| Gemini 2.5 Flash    | Google     | 1,048,576  | General tasks  |
| GPT OSS 120B        | OpenRouter | 131,072    | Free tier      |
| Nemotron Super 120B | OpenRouter | 131,072    | Free reasoning |

### AI Features

1. **Smart Autocomplete**
   - Context-aware suggestions
   - 6-minute session timeout to prevent over-reliance
   - Citation-aware completions

2. **Research Gap Analysis**
   - Identifies missing citations
   - Suggests related papers
   - Highlights research opportunities

3. **Citation Confidence Scoring**
   - Scores citations 0-100
   - Warns about unsupported claims
   - Suggests missing links

4. **Multi-Model Verification**
   - Cross-checks outputs across models
   - Reduces hallucinations
   - Improves accuracy

---

## Security & Authentication

### Authentication Methods

1. **Email/Password**
   - OTP verification required
   - Secure password hashing (Supabase Auth)
   - Custom email templates

2. **OAuth Providers**
   - Google OAuth
   - Additional providers ready for integration

3. **Multi-Factor Authentication**
   - Email OTP
   - SMS OTP (Twilio integration)
   - User-selected preference

### Security Features

1. **Row-Level Security (RLS)**
   - Supabase RLS policies
   - User data isolation

2. **API Security**
   - JWT token validation
   - Rate limiting (express-rate-limit)
   - CORS protection

3. **Data Protection**
   - Encryption at rest
   - Secure secret management (SecretsService)
   - No hardcoded credentials

4. **Audit Logging**
   - User action tracking
   - Login history
   - Security event monitoring

---

## Deployment & Infrastructure

### Local Development

```yaml
# docker-compose.yml
- PostgreSQL 17 with pgvector extension
- Port mapping: 5435:5432
- Persistent volume for data
```

### Environment Configuration

**Backend** (`.env`):

```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
LEMONSQUEEZY_API_KEY=...
RESEND_API_KEY=...
TWILIO_ACCOUNT_SID=...
```

**Frontend** (`.env`):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BACKEND_URL=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

### Secret Management

The `SecretsService` (`backend/src/services/secrets-service.ts`) provides:

- Environment variable abstraction
- Secure secret rotation
- Fallback to environment variables

---

## Business Model & Monetization

### Subscription Tiers

| Feature         | Free      | Student ($9/mo) | Researcher ($19/mo) |
| --------------- | --------- | --------------- | ------------------- |
| Storage         | 100MB     | 5GB             | 100GB               |
| AI Requests     | 50/mo     | 500/mo          | Unlimited           |
| Export Formats  | Basic     | All             | All + Journal-ready |
| Collaboration   | 2 users   | 10 users        | Unlimited           |
| Workspaces      | 1         | 5               | Unlimited           |
| Citation Styles | 3         | All             | All + Custom        |
| Support         | Community | Email           | Priority            |

### Payment Integration

- **Provider**: LemonSqueezy
- **Features**:
  - Subscription management
  - Invoice generation
  - Webhook handling
  - Proration support
  - Trial periods

### Affiliate Program

- Referral tracking (`affiliate_ref` field)
- Commission-based rewards
- Attribution tracking

---

## Development Workflow

### Backend Scripts

```json
{
  "start": "npx tsx src/hybrid/main-server.ts",
  "dev": "npx tsx watch src/hybrid/main-server.ts",
  "build": "npx tsc",
  "lint": "eslint"
}
```

### Frontend Scripts

```json
{
  "start": "next start",
  "dev": "next dev --webpack",
  "build": "next build",
  "lint": "eslint"
}
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

### Code Quality

- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Winston** - Structured logging
- **Prometheus** - Metrics collection

---

## Key Files Reference

### Configuration Files

| File                           | Purpose                        |
| ------------------------------ | ------------------------------ |
| `backend/.env`                 | Backend environment variables  |
| `frontend/.env`                | Frontend environment variables |
| `backend/prisma/schema.prisma` | Database schema                |
| `docker-compose.yml`           | Local database setup           |
| `backend/nodemon.json`         | Development server config      |

### Entry Points

| File                                | Purpose              |
| ----------------------------------- | -------------------- |
| `backend/src/hybrid/main-server.ts` | Backend server entry |
| `frontend/app/page.tsx`             | Frontend entry       |
| `frontend/middleware.ts`            | Next.js middleware   |

### Core Services

| File                        | Lines | Purpose                 |
| --------------------------- | ----- | ----------------------- |
| `aiService.ts`              | 2,580 | Main AI orchestration   |
| `subscriptionService.ts`    | 2,953 | Billing & subscriptions |
| `editorService.ts`          | 1,817 | Document management     |
| `exportService.ts`          | 1,898 | Export functionality    |
| `citationService.ts`        | 1,313 | Citation management     |
| `notificationService.ts`    | 1,053 | Notifications           |
| `researchCoPilotService.ts` | 1,268 | Research AI             |

---

## Summary

ScholarForge AI is a **production-ready, enterprise-grade academic research platform** featuring:

✅ **Comprehensive AI Integration** - Multiple providers, intelligent fallbacks  
✅ **Real-time Collaboration** - Yjs-powered CRDT editing  
✅ **Advanced Citation Management** - Multi-format, verified sources  
✅ **Flexible Export System** - 13+ formats including journal-ready  
✅ **Workspace & Team Management** - Role-based access, invitations  
✅ **Task Management** - Full project management capabilities  
✅ **Subscription Billing** - LemonSqueezy integration  
✅ **Security First** - OTP, RLS, audit logging  
✅ **Scalable Architecture** - Microservices-ready, typed codebase

**Total Codebase Size**: ~150,000+ lines of TypeScript  
**Database Models**: 70+ entities  
**API Endpoints**: 100+ routes  
**Services**: 50+ business logic services

This platform represents a complete solution for modern academic research, combining the power of AI with the rigor required for scholarly work.
