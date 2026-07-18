# Contributing to WorkContext

Thank you for your interest in contributing to WorkContext! We appreciate all kinds of contributions—bug reports, feature suggestions, documentation improvements, and code contributions.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Areas We Need Help](#areas-we-need-help)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Questions?](#questions)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors are expected to:

- Be respectful and constructive in all interactions
- Welcome diverse perspectives and backgrounds
- Report any inappropriate behavior to the maintainers
- Focus on what's best for the community

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+ or **yarn** 4+
- **PostgreSQL** 14+
- **Git**

### Fork & Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/workcontext.git
cd workcontext
```

3. Add upstream remote to sync with main repo:

```bash
git remote add upstream https://github.com/marowa-labs/workcontext.git
```

## Development Setup

### 1. Install Dependencies

**Backend:**

```bash
cd backend
npm install
```

**Frontend:**

```bash
cd ../frontend
npm install
```

### 2. Environment Configuration

**Backend (.env):**
Create `backend/.env` with:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/workcontext_dev

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GOOGLE_AI_API_KEY=your_google_key
OPENAI_API_KEY=your_openai_key
OPENROUTER_API_KEY=your_openrouter_key

# Email
PLUNK_API_KEY=your_plunk_key

# Server
NODE_ENV=development
PORT=3001
```

**Frontend (.env.local):**
Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Start Development Servers

**Backend (in `backend/` directory):**

```bash
npm run dev
```

Runs on `http://localhost:3001`

**Frontend (in `frontend/` directory, new terminal):**

```bash
npm run dev
```

Runs on `http://localhost:3000`

## Making Changes

### Branch Naming Convention

Create branches with clear, descriptive names:

```
feature/add-ai-chat-improvements
fix/resolve-editor-sync-issue
docs/update-api-documentation
refactor/optimize-search-service
```

### Code Style

**TypeScript:**

- Use strict mode (`strict: true` in tsconfig.json)
- Always annotate types—avoid `any`
- Use interfaces for object types
- Keep functions focused and under 50 lines when possible

**Formatting:**

- Use ESLint & Prettier (runs automatically on save in most IDEs)
- 2-space indentation
- Single quotes for strings
- Semicolons required

**React/Components:**

- Use functional components with hooks
- Keep components under 300 lines
- Extract reusable logic into custom hooks
- Use TypeScript props interfaces

**Database (Prisma):**

- Add comments to complex fields
- Use descriptive model names
- Keep relations clean and bidirectional when needed
- Always create migrations: `npx prisma migrate dev --name description`

### Linting & Testing

Run before committing:

```bash
# Backend
cd backend
npm run lint
npm run test

# Frontend
cd frontend
npm run lint
npm run test
```

## Commit Guidelines

Use clear, descriptive commit messages following conventional commits:

```
type(scope): brief description

[optional body with details]

[optional footer with issue reference]
```

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `refactor:` Code restructuring
- `perf:` Performance improvement
- `test:` Test additions/modifications
- `chore:` Build, deps, tooling

**Examples:**

```
feat(editor): add real-time collaborative cursors
fix(ai): prevent duplicate task extraction on save
docs(api): update authentication endpoints
refactor(search): optimize query performance
test(auth): add login flow tests
```

## Pull Request Process

### Before Submitting

1. **Keep your branch up to date:**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks:**

   ```bash
   npm run lint
   npm run test
   npm run build
   ```

3. **Test your changes manually** in the dev environment

### Submitting a PR

1. Push your branch to your fork
2. Open a Pull Request against `main` branch
3. Fill out the PR template completely:
   - Clear title describing the change
   - Reference related issues (fixes #123)
   - Describe what changed and why
   - Include screenshots for UI changes
   - Mention any breaking changes
   - Highlight any areas needing review

### PR Requirements

- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated (if applicable)
- [ ] No console errors/warnings
- [ ] Descriptive commit messages
- [ ] At least 1 approval from maintainers

### Code Review

- Maintain open communication
- Address feedback promptly
- Ask questions if guidance is unclear
- Reviewers will check for:
  - Code quality and standards
  - Performance impact
  - Security implications
  - Test coverage
  - Documentation completeness

## Areas We Need Help

### High Priority

- **Performance optimization** — Profile and improve query speeds, reduce bundle size
- **Real-time collaboration** — Enhance Yjs/Hocuspocus sync, handle edge cases
- **AI features** — Improve task extraction, smart suggestions, context awareness
- **Mobile experience** — Responsive design, mobile-specific features

### Medium Priority

- **Testing** — Increase unit and integration test coverage
- **Documentation** — API docs, deployment guides, architecture explanations
- **Accessibility** — WCAG compliance, screen reader support
- **Error handling** — Better error messages, recovery flows

### Community

- **User feedback** — Report bugs, suggest features
- **Examples** — Create tutorials, sample workspaces
- **Translations** — Internationalization support

## Reporting Bugs

1. **Search existing issues** to avoid duplicates
2. **Use the bug report template** when creating an issue
3. **Include:**
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/screen recordings
   - Environment (OS, browser, Node version)
   - Error messages/stack traces

## Feature Requests

1. **Check existing issues** and discussions
2. **Describe the use case** — why this feature matters
3. **Provide examples** of how it would work
4. **Consider alternatives** you've already tried
5. **Be open to feedback** from maintainers and community

## Questions?

- **Documentation:** See [README.md](README.md) and [docs/](docs/) folder
- **Discussions:** Open a GitHub Discussion for questions
- **Issues:** Use GitHub Issues for bugs and features
- **Email:** Contact maintainers through GitHub profile

---

## Additional Resources

- [WorkContext Architecture](CODEBASE_ANALYSIS.md)
- [Development Roadmap](ROADMAP.md)
- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)

---

Thank you for contributing to WorkContext! Your efforts help make team productivity better for everyone. 🚀
