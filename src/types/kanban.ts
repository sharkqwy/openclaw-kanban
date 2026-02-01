export type CardStatus = 'inbox' | 'today' | 'in-progress' | 'done'

export interface Card {
  id: string
  title: string
  status: CardStatus
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  subtasks?: { total: number; completed: number }
  
  // Monitoring fields
  description?: string       // Multi-line notes/details
  session?: string          // Which session is working on this
  createdAt?: number        // Unix timestamp
  updatedAt?: number        // Last update timestamp
  completedAt?: number      // When moved to done
  startedAt?: number        // When moved to in-progress
  timeSpent?: number        // Total time in ms
}

export interface Column {
  id: CardStatus
  title: string
  emoji: string
  color: string
  cards: Card[]
}

export interface BoardState {
  columns: Column[]
}

// Column configuration
export const COLUMN_CONFIG: Record<CardStatus, { title: string; emoji: string; color: string }> = {
  'inbox': { title: 'Inbox', emoji: '📥', color: '#a855f7' },      // purple
  'today': { title: 'Today', emoji: '🎯', color: '#ff4d4d' },      // coral
  'in-progress': { title: 'In Progress', emoji: '⚡', color: '#00e5cc' }, // cyan
  'done': { title: 'Done', emoji: '✅', color: '#22c55e' },        // green
}
