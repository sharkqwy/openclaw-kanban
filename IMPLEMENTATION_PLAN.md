# Implementation Plan - OpenClaw Kanban

> STATUS: PLANNING
> Last updated: 2026-02-01
> Target: Public GitHub repo at `github.com/openclaw/openclaw-kanban`
> Reference: [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban)

## Phase 0: Repository Setup
**Goal:** Initialize repo structure for public release

### Tasks
- [ ] **0.1** Initialize git repo with proper .gitignore
- [ ] **0.2** Create package.json with correct metadata
  - name: `openclaw-kanban`
  - bin entry for CLI
  - repository, homepage, bugs URLs
- [ ] **0.3** Set up assets folder for screenshots
- [ ] **0.4** Create placeholder screenshot
- [ ] **0.5** Verify README renders correctly on GitHub

### Acceptance
- [ ] `git remote -v` shows github.com/openclaw/openclaw-kanban
- [ ] README badges work

---

## Phase 1: Project Setup & Static Board (MVP)
**Goal:** Render a static kanban board with hardcoded data

### Tasks
- [ ] **1.1** Initialize Vite + React + TypeScript project
  - `pnpm create vite openclaw-kanban --template react-ts`
  - Add Tailwind CSS
  - Configure path aliases
- [ ] **1.2** Set up design tokens (CSS variables from specs/04-ui-design.md)
- [ ] **1.3** Add Fontshare fonts (Clash Display, Satoshi)
- [ ] **1.4** Create basic components:
  - [ ] `Board.tsx` - Grid container for columns
  - [ ] `Column.tsx` - Single column with header
  - [ ] `Card.tsx` - Task card component
- [ ] **1.5** Render hardcoded board data
- [ ] **1.6** Add responsive styles (mobile single-column)

### Acceptance
- [ ] `pnpm dev` shows 4-column kanban board
- [ ] Matches openclaw.ai visual style

---

## Phase 2: Drag and Drop
**Goal:** Enable card movement between columns

### Tasks
- [ ] **2.1** Install @dnd-kit/core and @dnd-kit/sortable
- [ ] **2.2** Create Zustand store for board state
- [ ] **2.3** Implement DndContext wrapper in Board
- [ ] **2.4** Make cards draggable (useDraggable)
- [ ] **2.5** Make columns droppable (useDroppable)
- [ ] **2.6** Handle onDragEnd to update state
- [ ] **2.7** Add drag overlay (ghost card)
- [ ] **2.8** Add keyboard navigation (a11y)

### Acceptance
- [ ] Can drag card from Inbox to Today
- [ ] Can reorder cards within column
- [ ] Visual feedback during drag

---

## Phase 3: KANBAN.md Sync
**Goal:** Two-way sync with markdown file

### Tasks
- [ ] **3.1** Create markdown parser (`lib/markdown.ts`)
  - Parse headings as columns
  - Parse list items as cards
  - Handle checkbox syntax
- [ ] **3.2** Create markdown serializer
  - Convert board state to markdown
  - Preserve formatting
- [ ] **3.3** Add file read/write via fetch (localhost server)
- [ ] **3.4** Connect store to file operations
- [ ] **3.5** Add debounced save (500ms)
- [ ] **3.6** Add sync status indicator
- [ ] **3.7** Handle file not found (create default)

### Acceptance
- [ ] Load KANBAN.md on startup
- [ ] Changes persist to file
- [ ] Sync indicator shows status

---

## Phase 4: Gateway Integration
**Goal:** Show OpenClaw session activity

### Tasks
- [ ] **4.1** Create Gateway client (`lib/gateway.ts`)
- [ ] **4.2** Add WebSocket connection logic
- [ ] **4.3** Create Sidebar component
- [ ] **4.4** Display active sessions list
- [ ] **4.5** Add connection status indicator
- [ ] **4.6** Show activity feed (optional)

### Acceptance
- [ ] Sidebar shows active OpenClaw sessions
- [ ] Connection status visible

---

## Phase 5: Task Automation (Stretch)
**Goal:** Create cron jobs from tasks

### Tasks
- [ ] **5.1** Add "Schedule" action to card menu
- [ ] **5.2** Date/time picker for scheduling
- [ ] **5.3** Create cron job via Gateway API
- [ ] **5.4** Show scheduled tasks with next run time
- [ ] **5.5** Enable/disable/delete cron jobs

### Acceptance
- [ ] Can schedule a task as reminder
- [ ] Cron job appears in list

---

## Phase 6: npm Publish & Release
**Goal:** Publish to npm for easy installation

### Tasks
- [ ] **6.1** Create CLI wrapper (`bin/cli.js`)
- [ ] **6.2** Configure Vite for library build
- [ ] **6.3** Test `npx openclaw-kanban` locally
- [ ] **6.4** Add --file flag for custom KANBAN.md path
- [ ] **6.5** Publish to npm registry
- [ ] **6.6** Create GitHub release with changelog
- [ ] **6.7** Announce on OpenClaw Discord

### Acceptance
- [ ] `npx openclaw-kanban` works globally
- [ ] Package on npmjs.com
- [ ] GitHub releases page has v1.0.0

---

## Notes
- Keep it simple: No backend, file-based persistence
- **Reference vibe-kanban heavily** for patterns and UX
- Use openclaw.ai design system exactly
- Target: Public repo for all OpenClaw users
