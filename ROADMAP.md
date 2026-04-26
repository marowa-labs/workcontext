# ScholarForge AI - Product Pivot Roadmap

## Vision
Transform from an academic research assistant into a **context-aware productivity workspace** for teams.

**Tagline:** *"Notion makes you organize. Asana makes you manage. ScholarForge just makes you productive."*

---

## Phase 1: Reposition & Simplify (Weeks 1-4)

### Week 1: Strip Academic DNA

#### Remove/Deprecate
- [ ] Citation system (move to `plugins/citations/` for later extraction)
- [ ] Research-specific terminology ("papers", "references", "academic")
- [ ] Complex AI features (multi-step research, consensus checking)
- [ ] CrossRef/Semantic Scholar integrations (keep backend, hide from UI)

#### Rename Throughout App
| Current | New |
|---------|-----|
| Projects | Spaces |
| Research Assistant | Workspace AI |
| Citations | Links |
| References | Connections |
| Academic Sources | Knowledge Base |
| Paper/Document | Page |

### Week 2: Core Repositioning

#### Update Marketing Copy
- [ ] Homepage hero section
- [ ] Feature descriptions
- [ ] Pricing page language
- [ ] Footer links and descriptions

#### Update UI Labels
- [ ] Navigation menu items
- [ ] Empty state messages
- [ ] Button labels
- [ ] Modal/Dialog titles
- [ ] Toast notifications

#### New Positioning Keywords
- **Focus:** Context, relationships, speed
- **Avoid:** Research, academic, citations, organizing
- **Emphasize:** Understanding, connections, getting things done

### Week 3: Add Smart Layer (Simple AI Features)

#### Feature 1: Smart @-Mentions
**What:** Type `@` anywhere to reference people, tasks, docs, or files
**Implementation:**
- Search across: Users, Tasks, Pages, Files, Spaces
- Fuzzy matching on title/content
- Show preview on hover
- Create bidirectional links automatically

**Files to modify:**
- `frontend/app/components/editor/Editor.tsx` - Add mention plugin
- `backend/src/api/search/route.ts` - Unified search endpoint

#### Feature 2: Quick Task Extraction
**What:** Highlight text → "Create Task" → Auto-fills title, suggests assignee from mentions
**Implementation:**
- Context menu in editor
- Parse assignee from @mentions in selected text
- Parse dates ("by Friday", "next week")
- One-click create

**Files to modify:**
- `frontend/app/components/editor/` - Add floating toolbar
- `backend/src/api/workspaces/tasks/route.ts` - Enhance create endpoint

#### Feature 3: Related Items Sidebar
**What:** Every page/task shows "Related" panel with 3-5 most relevant items
**Implementation:**
- Simple content similarity (TF-IDF or vector search)
- Show in sidebar on all pages/tasks
- Manual "Add Connection" option

**Files to modify:**
- `frontend/app/components/sidebar/RelatedItems.tsx` - New component
- `backend/src/services/relatedContent.ts` - Matching logic

### Week 4: Polish & Launch Prep

#### New Landing Page
- [ ] Hero: "Your workspace, understood"
- [ ] Feature blocks: Smart Mentions, Quick Tasks, Related Items
- [ ] Comparison section: Notion (manual) vs Asana (rigid) vs ScholarForge (smart)
- [ ] Open source CTA

#### Documentation
- [ ] Quick start guide
- [ ] Feature overview
- [ ] Use case examples (general productivity, not academic)

#### Open Source Preparation
- [ ] CONTRIBUTING.md
- [ ] Issue templates
- [ ] Code of conduct
- [ ] License review

---

## Differentiation: "Context-Aware Workspace"

### What Makes Us Different

| Notion | Asana | ScholarForge |
|--------|-------|--------------|
| Manual linking | No content relationships | Automatic relationships |
| Static pages | Task-focused | Context-aware pages |
| AI is bolted-on | No AI | AI understands your workspace |
| You organize everything | You manage tasks | We connect the dots |

### Core Value Props

1. **Relationships, Not Folders**
   - Everything is automatically connected
   - No manual tagging or organizing
   - Discovery happens naturally

2. **Action from Content**
   - Turn any text into a task
   - AI suggests next steps
   - No context switching

3. **Workspace Memory**
   - Ask questions across entire workspace
   - Find things you forgot you wrote
   - Never lose context

---

## Technical Debt Cleanup

### Before Phase 2
- [ ] Remove dead citation code
- [ ] Consolidate AI services
- [ ] Document remaining features
- [ ] Simplify database schema (remove citation tables if unused)

### File Structure Changes
```
frontend/app/
├── (dashboard)/
│   ├── spaces/           # was: projects
│   ├── tasks/
│   ├── pages/            # was: documents
│   └── knowledge-base/   # was: citations/references
├── components/
│   ├── mentions/         # NEW
│   ├── related-items/    # NEW
│   └── quick-actions/    # NEW
└── lib/
    └── ai/
        └── context-awareness/  # NEW
```

---

## Post-Phase 1: Future Phases (Optional)

### Phase 2: Enhanced Intelligence
- Full knowledge graph visualization
- Predictive task suggestions
- Automated gap analysis
- Smart summaries across spaces

### Phase 3: Team Intelligence
- Team patterns and insights
- Workload balancing suggestions
- Meeting prep from project context
- Automated status reports

### Phase 4: Platform & Ecosystem
- Plugin system
- API for integrations
- Community marketplace
- Enterprise features

---

## Success Metrics for Phase 1

- [ ] Homepage clearly communicates new positioning
- [ ] No academic terminology in UI
- [ ] Smart mentions working in editor
- [ ] Quick task extraction functional
- [ ] Related items appearing on all pages
- [ ] Clean, simple codebase
- [ ] Ready for open source contributors

---

## Open Questions

1. Should we keep any academic features as plugins?
2. What's the new pricing model? (Free open source + hosted paid?)
3. Do we need new integrations? (Slack, Linear, GitHub?)
4. What's the target user persona now? (Startups, agencies, consultancies?)

---

## Next Steps

**Immediate:**
1. Decide on target persona (general teams vs specific niche)
2. Approve this roadmap
3. Start Week 1 tasks (stripping academic features)

**This Week:**
- [ ] Rename all "Projects" to "Spaces"
- [ ] Remove citation UI components
- [ ] Update homepage copy

---

*Last updated: 2026-04-26*
*Status: Phase 1 Planning Complete*
