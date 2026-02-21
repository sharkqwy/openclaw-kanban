# 🚀 Mission Control

Visual task management, agent orchestration, and real-time monitoring for [OpenClaw](https://openclaw.ai).

**Stack:** Vite + React 19 + Tailwind CSS 4 + Zustand + @dnd-kit + Framer Motion + Hono + better-sqlite3

## Install & Run

```bash
# Run instantly (no install needed)
npx openclaw-kanban

# Or install globally
npm install -g openclaw-kanban
openclaw-kanban
```

Opens a web UI at `http://localhost:18790` with a kanban board, agent sidebar, and live feed.

### CLI Commands

```bash
npx openclaw-kanban                      # Start web UI
npx openclaw-kanban add "Deploy to prod" # Add task to Inbox
npx openclaw-kanban list                 # List all tasks
npx openclaw-kanban move <id> <column>   # Move task between columns
npx openclaw-kanban done <id>            # Mark task as done
```

## Development

```bash
git clone https://github.com/sharkqwy/openclaw-kanban.git
cd openclaw-kanban
npm install
npm run dev
```

This starts both:
- **API server** on `http://localhost:18790` (Hono + SQLite)
- **Frontend** on `http://localhost:5173` (Vite dev server, proxies API calls)

## Features

### Kanban Board (7 columns)
- **Planning → Inbox → Assigned → In Progress → Testing → Review → Done**
- Drag-and-drop with smooth animations
- Auto-dispatch when tasks move to "In Progress" with an assigned agent

### Task Management
- Full CRUD with priority, assignment, due dates
- Activity log per task (real-time polling)
- Deliverables tracking (files, URLs, artifacts)
- Sub-agent session tracking

### Agent System
- Collapsible sidebar with agent CRUD
- Status indicators (standby/working/offline)
- Filter by status

### Real-time Updates
- SSE (Server-Sent Events) for live task updates
- Live feed panel (collapsible right sidebar)
- Event filtering (all/tasks/agents)

### UI
- Dark OLED-friendly theme (#050810 background)
- Emerald green accent (#22C55E)
- Framer Motion transitions
- Responsive layout with collapsible sidebars

## Architecture

```
src/
├── server/          # Hono API server (runs on Node.js)
│   ├── db/          # SQLite schema and helpers
│   ├── sse.ts       # SSE broadcaster
│   └── index.ts     # API routes
├── shared/          # Types shared between client and server
│   └── types.ts
├── store/           # Zustand state management
│   └── mission.ts
├── hooks/           # React hooks
│   └── useSSE.ts    # SSE connection hook
├── components/      # React components
│   ├── Board.tsx    # Main kanban board
│   ├── Column.tsx   # Individual column
│   ├── TaskCard.tsx # Task card
│   ├── TaskModal.tsx # Task detail/edit modal
│   ├── AgentsSidebar.tsx
│   ├── LiveFeed.tsx
│   └── ...
└── lib/             # Legacy utilities (gateway, openclaw-api)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | Health check |
| GET/POST | `/api/tasks` | List/create tasks |
| GET/PATCH/DELETE | `/api/tasks/:id` | Get/update/delete task |
| GET/POST | `/api/tasks/:id/activities` | Task activity log |
| GET/POST | `/api/tasks/:id/deliverables` | Task deliverables |
| GET/POST | `/api/tasks/:id/subagent` | Sub-agent sessions |
| POST | `/api/tasks/:id/dispatch` | Dispatch task to agent |
| GET/POST | `/api/agents` | List/create agents |
| PATCH/DELETE | `/api/agents/:id` | Update/delete agent |
| GET/POST | `/api/events` | List/create events |
| GET | `/api/events/stream` | SSE stream |
| GET | `/read` | Read KANBAN.md (legacy) |
| POST | `/write` | Write KANBAN.md (legacy) |

## Scripts

```bash
npm run dev        # Start server + client
npm run server     # Start API server only
npm run dev:client # Start Vite dev only
npm run build      # Production build
npm run test       # Run tests (Vitest)
npm run test:watch # Tests in watch mode
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `18790` | API server port |
| `DATABASE_PATH` | `./mission-control.db` | SQLite database path |
| `KANBAN_FILE` | `./KANBAN.md` | Legacy KANBAN.md path |

## License

MIT
