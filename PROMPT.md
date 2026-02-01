# OpenClaw Kanban - Development Prompt

## JTBD (Job To Be Done)
Build a visual kanban board that integrates natively with OpenClaw, allowing users to:
- View and manage tasks in a drag-and-drop interface
- Sync tasks with KANBAN.md (Markdown persistence)
- See real-time OpenClaw session/agent activity
- Create scheduled tasks (cron jobs) from the board

## Context Files
Read these files for full context:
- `specs/*.md` — Feature specifications
- `IMPLEMENTATION_PLAN.md` — Current task breakdown
- `AGENTS.md` — Build/test commands and operational notes
- `SPEC.md` — Original project specification

## Reference Projects
- `../vibe-kanban/` — BloopAI's Rust implementation (architecture reference)
- `../openclaw.ai/` — Design system (colors, fonts, layout)

## Design Constraints
- **Stack**: React 19 + Vite + TypeScript + Tailwind CSS
- **State**: Zustand (simple, no Redux complexity)
- **DnD**: @dnd-kit (modern, accessible)
- **Markdown**: remark + gray-matter (parse KANBAN.md)
- **No backend**: Use OpenClaw Gateway API directly

## Design System (from openclaw.ai)
```css
:root {
  --bg-deep: #050810;
  --bg-surface: #0a0f1a;
  --bg-elevated: #111827;
  --coral-bright: #ff4d4d;
  --cyan-bright: #00e5cc;
  --text-primary: #f0f4ff;
  --text-secondary: #8892b0;
  --font-display: 'Clash Display', system-ui;
  --font-body: 'Satoshi', system-ui;
}
```

## Current Mode
Check IMPLEMENTATION_PLAN.md for current phase (PLANNING or BUILDING).
