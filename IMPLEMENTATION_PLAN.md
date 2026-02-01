# Implementation Plan - OpenClaw Kanban

> STATUS: COMPLETE (pending npm publish)
> Last updated: 2026-02-01
> Target: Public GitHub repo at `github.com/openclaw/openclaw-kanban`
> Reference: [BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban)

## Phase 0: Repository Setup ✅
**Goal:** Initialize repo structure for public release

### Tasks
- [x] **0.1** Initialize git repo with proper .gitignore
- [x] **0.2** Create package.json with correct metadata
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

## Phase 1: Project Setup & Static Board (MVP) ✅
**Goal:** Render a static kanban board with hardcoded data

### Tasks
- [x] **1.1** Initialize Vite + React + TypeScript project
  - `npm create vite . --template react-ts`
  - Add Tailwind CSS 4
  - Configure path aliases (@/)
- [x] **1.2** Set up design tokens (CSS variables from specs/04-ui-design.md)
- [x] **1.3** Add Fontshare fonts (Clash Display, Satoshi)
- [x] **1.4** Create basic components:
  - [x] `Board.tsx` - Grid container for columns
  - [x] `Column.tsx` - Single column with header
  - [x] `Card.tsx` - Task card component
- [x] **1.5** Render hardcoded board data (8 sample cards)
- [x] **1.6** Add responsive styles (mobile single-column)

### Acceptance
- [x] `npm run dev` shows 4-column kanban board
- [x] Matches openclaw.ai visual style (dark theme, coral/cyan accents)

---

## Phase 2: Drag and Drop ✅
**Goal:** Enable card movement between columns

### Tasks
- [x] **2.1** Install @dnd-kit/core and @dnd-kit/sortable
- [x] **2.2** Create Zustand store for board state
- [x] **2.3** Implement DndContext wrapper in Board
- [x] **2.4** Make cards draggable (useSortable in SortableCard)
- [x] **2.5** Make columns droppable (useDroppable)
- [x] **2.6** Handle onDragEnd to update state
- [x] **2.7** Add drag overlay (ghost card)
- [x] **2.8** Add keyboard navigation (a11y)

### Acceptance
- [x] Can drag card from Inbox to Today
- [x] Can reorder cards within column
- [x] Visual feedback during drag

---

## Phase 3: KANBAN.md Sync ✅
**Goal:** Two-way sync with markdown file

### Tasks
- [x] **3.1** Create markdown parser (`lib/markdown.ts`)
  - Parse headings as columns
  - Parse list items as cards
  - Handle checkbox syntax, tags, priority
- [x] **3.2** Create markdown serializer
  - Convert board state to markdown
  - Preserve formatting
- [x] **3.3** Add file read/write via fetch (localhost server)
- [x] **3.4** Connect store to file operations
- [x] **3.5** Add debounced save (500ms)
- [x] **3.6** Add sync status indicator (SyncIndicator component)
- [x] **3.7** Handle file not found (create default)

### Acceptance
- [x] Load KANBAN.md on startup
- [x] Changes persist to file (via server or File System Access API)
- [x] Sync indicator shows status

---

## Phase 4: Gateway Integration ✅
**Goal:** Show OpenClaw session activity

### Tasks
- [x] **4.1** Create Gateway client (`lib/gateway.ts`)
- [x] **4.2** Add WebSocket connection logic
- [x] **4.3** Create Sidebar component
- [x] **4.4** Display active sessions list
- [x] **4.5** Add connection status indicator
- [ ] **4.6** Show activity feed (optional - stretch)

### Acceptance
- [x] Sidebar shows active OpenClaw sessions
- [x] Connection status visible

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
- [x] **6.1** Create CLI wrapper (`bin/cli.js`)
- [x] **6.2** Configure Vite for library build
- [x] **6.3** Test `npx openclaw-kanban` locally
- [x] **6.4** Add --file flag for custom KANBAN.md path
- [ ] **6.5** Publish to npm registry (待 Kai 确认)
- [x] **6.6** GitHub repo created: github.com/sharkqwy/openclaw-kanban
- [ ] **6.7** Announce on OpenClaw Discord

### Acceptance
- [x] CLI works locally
- [ ] Package on npmjs.com (待发布)
- [ ] GitHub releases page has v1.0.0

---

## Notes
- Keep it simple: No backend, file-based persistence
- **Reference vibe-kanban heavily** for patterns and UX
- Use openclaw.ai design system exactly
- Target: Public repo for all OpenClaw users
