# OpenClaw Kanban - Project Spec

> A visual kanban tool natively integrated with OpenClaw
> 
> **GitHub:** `github.com/openclaw/openclaw-kanban` (to be created)
> **Reference:** [github.com/BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban)

## Vision

[VibeKanban](https://github.com/BloopAI/vibe-kanban) is an excellent orchestration platform for Claude Code, Codex, and other coding agents. However, it's designed for CLI-based coding agents with git worktrees.

**OpenClaw Kanban** brings similar capabilities to OpenClaw users:
- Visual task management that syncs with markdown files
- Native integration with OpenClaw Gateway (sessions, cron, activity)
- Simpler architecture (no Rust backend, just frontend + Gateway API)
- Easy installation via npm for all OpenClaw users

## Key Differences from VibeKanban

| Feature | VibeKanban | OpenClaw Kanban |
|---------|------------|-----------------|
| Backend | Rust server | None (Gateway API) |
| Storage | SQLite | KANBAN.md (Markdown) |
| Git Integration | Worktrees | Optional (file-based) |
| Target Users | Coding agents (Claude Code) | OpenClaw users |
| Installation | CLI + Desktop | npm / npx |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw Kanban                       │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + Tailwind)                            │
│  - Drag-and-drop kanban board                           │
│  - Real-time updates via WebSocket                      │
│  - Task editor with markdown support                    │
├─────────────────────────────────────────────────────────┤
│  OpenClaw Gateway API                                   │
│  - /ws for real-time events                             │
│  - cron tool for scheduled tasks                        │
│  - sessions_list for active agents                      │
├─────────────────────────────────────────────────────────┤
│  Storage: ~/.openclaw/workspace/KANBAN.md               │
│  - Markdown-based persistence                           │
│  - Git-friendly, human-readable                         │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React 19 + Vite | Fast, modern, good DX |
| Styling | Tailwind CSS | Utility-first, matches openclaw.ai |
| State | Zustand | Simple, no boilerplate |
| DnD | @dnd-kit | Modern, accessible, performant |
| Markdown | remark + gray-matter | Robust parsing |
| Gateway | OpenClaw WebSocket API | Native integration |

## Distribution

### npm Package
```json
{
  "name": "openclaw-kanban",
  "bin": {
    "openclaw-kanban": "./bin/cli.js"
  }
}
```

### Usage
```bash
# Quick start
npx openclaw-kanban

# Global install
npm install -g openclaw-kanban
openclaw-kanban

# With specific KANBAN.md path
openclaw-kanban --file ~/projects/my-project/KANBAN.md
```

## MVP Features

### Phase 1: Static Board
- [ ] Parse KANBAN.md into board state
- [ ] Render columns: Inbox, Today, In Progress, Done
- [ ] Drag and drop tasks between columns
- [ ] Write changes back to KANBAN.md

### Phase 2: Gateway Integration
- [ ] Connect to OpenClaw Gateway WebSocket
- [ ] Show active sessions in sidebar
- [ ] Display agent activity feed
- [ ] Auth with gateway token

### Phase 3: Task Automation
- [ ] Create cron jobs from tasks
- [ ] Link tasks to sessions
- [ ] Due date → reminder cron
- [ ] Task completion notifications

## KANBAN.md Format

Compatible with existing OpenClaw workspace conventions:

```markdown
# KANBAN

> Last updated: 2026-02-01

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

## Design System

Exact match with [openclaw.ai](https://openclaw.ai):

```css
:root {
  /* Backgrounds */
  --bg-deep: #050810;
  --bg-surface: #0a0f1a;
  --bg-elevated: #111827;
  
  /* Accents */
  --coral-bright: #ff4d4d;
  --cyan-bright: #00e5cc;
  
  /* Text */
  --text-primary: #f0f4ff;
  --text-secondary: #8892b0;
  
  /* Fonts */
  --font-display: 'Clash Display', system-ui;
  --font-body: 'Satoshi', system-ui;
}
```

## References

### Primary Reference
- **[BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban)** — Architecture patterns, UX inspiration, feature ideas

### Design Reference
- **[openclaw/openclaw.ai](https://github.com/openclaw/openclaw.ai)** — Design system, colors, fonts, layout

### Integration Reference
- **[OpenClaw Docs](https://docs.openclaw.ai)** — Gateway API, WebSocket, cron

## Repository Structure

```
openclaw-kanban/
├── README.md           # Public documentation
├── LICENSE             # MIT
├── CONTRIBUTING.md     # Contribution guide
├── SPEC.md             # This file
├── package.json
├── src/
│   ├── components/
│   ├── hooks/
│   ├── stores/
│   ├── lib/
│   └── main.tsx
├── bin/
│   └── cli.js          # CLI entry point
└── assets/
    └── screenshot.png
```

## Success Criteria

1. **Easy Installation** — `npx openclaw-kanban` works out of the box
2. **Beautiful UI** — Matches openclaw.ai exactly
3. **Seamless Sync** — KANBAN.md ↔ UI sync is reliable
4. **Gateway Integration** — Shows real-time OpenClaw activity
5. **Community Adoption** — Published to npm, starred on GitHub
