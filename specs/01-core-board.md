# Spec: Core Kanban Board

## Overview
The main kanban board UI with columns and draggable cards.

## Requirements

### Columns
- [ ] 4 default columns: Inbox, Today, In Progress, Done
- [ ] Each column has a header with icon and count
- [ ] Columns have distinct border colors (match openclaw.ai theme)
- [ ] Vertical scrolling within columns if content overflows

### Cards
- [ ] Cards display task title and optional tags
- [ ] Cards have colored left border based on priority/status
- [ ] Cards show subtask progress if applicable
- [ ] Hover state with subtle elevation

### Drag and Drop
- [ ] Drag cards between columns
- [ ] Drag cards within same column (reorder)
- [ ] Visual feedback during drag (ghost card, drop zone highlight)
- [ ] Keyboard accessible (a11y)

## Acceptance Criteria
- User can view all 4 columns on desktop
- User can drag a card from Inbox to Today
- Card order persists after drag
- Responsive layout (single column on mobile)
