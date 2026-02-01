# OpenClaw Kanban - Agent Instructions

## Project Setup
```bash
cd projects/openclaw-kanban
pnpm install
pnpm dev
```

## Backpressure Commands (run after each change)
```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build (production)
pnpm build
```

## Test Commands
```bash
# Unit tests
pnpm test

# E2E (if configured)
pnpm test:e2e
```

## File Structure
```
openclaw-kanban/
├── src/
│   ├── components/      # React components
│   │   ├── Board.tsx
│   │   ├── Column.tsx
│   │   ├── Card.tsx
│   │   └── Sidebar.tsx
│   ├── hooks/           # Custom hooks
│   │   ├── useKanban.ts
│   │   └── useGateway.ts
│   ├── stores/          # Zustand stores
│   │   └── kanbanStore.ts
│   ├── lib/             # Utilities
│   │   ├── markdown.ts  # KANBAN.md parser
│   │   └── gateway.ts   # OpenClaw API client
│   ├── App.tsx
│   └── main.tsx
├── specs/               # Feature specs
├── PROMPT.md
├── AGENTS.md
├── IMPLEMENTATION_PLAN.md
└── package.json
```

## Commit Convention
```
feat: add drag-and-drop support
fix: correct markdown parsing
docs: update README
refactor: simplify state management
```

## Operational Learnings
- (Add learnings as you discover them)

## Gateway Integration Notes
- WebSocket endpoint: `ws://127.0.0.1:18789`
- Auth: Bearer token from `gateway.auth.token`
- Sessions API: Use `sessions_list` for active agents
- Cron API: Use `cron` tool for scheduled tasks

## KANBAN.md Format
```markdown
# KANBAN

## 📥 Inbox
- [ ] Task description

## 🎯 Today
- [ ] Task description
- [x] Completed task ✓

## 🔄 In Progress
- [~] Active task

## ✅ Done
- [x] Done task
```
