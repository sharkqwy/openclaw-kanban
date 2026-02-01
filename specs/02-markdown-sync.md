# Spec: Markdown Sync (KANBAN.md)

## Overview
Two-way sync between the kanban board UI and KANBAN.md file.

## Requirements

### Read KANBAN.md
- [ ] Parse markdown headings as columns (## 📥 Inbox, etc.)
- [ ] Parse list items as cards
- [ ] Detect checkbox state: `[ ]` todo, `[x]` done, `[~]` in progress
- [ ] Extract tags from `<span class="tag">` or inline markers
- [ ] Handle metadata block (timestamp, notes)

### Write KANBAN.md
- [ ] Serialize board state back to markdown
- [ ] Preserve formatting and whitespace
- [ ] Update checkbox states on card move
- [ ] Add/remove cards to correct sections
- [ ] Preserve comments and extra content

### File Operations
- [ ] Read file via OpenClaw Gateway file API (or localhost fetch)
- [ ] Write file on change (debounced, 500ms)
- [ ] Handle file not found (create template)
- [ ] Show sync status indicator

## Parser Format
```typescript
interface KanbanFile {
  columns: Column[];
  metadata?: {
    lastUpdated: string;
    notes?: string;
  };
}

interface Column {
  id: string;
  title: string;
  emoji: string;
  cards: Card[];
}

interface Card {
  id: string;
  title: string;
  status: 'todo' | 'done' | 'in-progress';
  tags?: string[];
}
```

## Acceptance Criteria
- Load existing KANBAN.md and render board
- Drag card, verify KANBAN.md updated
- Edit KANBAN.md externally, verify board updates (if watching)
