import { create } from 'zustand'
import type { Card, CardStatus, Column } from '@/types'
import { COLUMN_CONFIG } from '@/types'
import { parseKanban, serializeKanban, createColumnsFromCards, DEFAULT_KANBAN } from '@/lib/markdown'
import { readFile, writeFile } from '@/lib/file-sync'

// Sample data for initial development / fallback
const SAMPLE_CARDS: Card[] = [
  { id: '1', title: 'Review PR #42 - API refactor', status: 'inbox', tags: ['code-review'], priority: 'high' },
  { id: '2', title: 'Update documentation for new features', status: 'inbox', tags: ['docs'] },
  { id: '3', title: 'Fix auth token refresh issue', status: 'today', tags: ['bug'], priority: 'high' },
  { id: '4', title: 'Design new dashboard layout', status: 'today', tags: ['design'] },
  { id: '5', title: 'Implement drag-and-drop', status: 'in-progress', tags: ['feature'], subtasks: { total: 5, completed: 3 }, startedAt: Date.now() - 3600000 },
  { id: '6', title: 'Set up CI/CD pipeline', status: 'in-progress', tags: ['devops'] },
  { id: '7', title: 'Initialize project repository', status: 'done', tags: ['setup'], completedAt: Date.now() - 86400000 },
  { id: '8', title: 'Create component architecture', status: 'done', tags: ['architecture'], completedAt: Date.now() - 43200000 },
]

function createColumns(cards: Card[]): Column[] {
  const statuses: CardStatus[] = ['inbox', 'today', 'in-progress', 'done']
  
  return statuses.map(status => ({
    id: status,
    ...COLUMN_CONFIG[status],
    cards: cards.filter(card => card.status === status),
  }))
}

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error'

interface BoardStore {
  columns: Column[]
  syncStatus: SyncStatus
  syncError: string | null
  lastSaved: Date | null
  
  // Actions
  moveCard: (cardId: string, fromColumn: CardStatus, toColumn: CardStatus, toIndex?: number) => void
  reorderCard: (columnId: CardStatus, fromIndex: number, toIndex: number) => void
  addCard: (card: Card) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  deleteCard: (cardId: string) => void
  
  // Sync actions
  loadFromFile: () => Promise<void>
  saveToFile: () => Promise<void>
  setColumns: (columns: Column[]) => void
}

// Debounce timer for auto-save
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const SAVE_DELAY = 500 // ms

export const useBoardStore = create<BoardStore>((set, get) => ({
  columns: createColumns(SAMPLE_CARDS),
  syncStatus: 'idle',
  syncError: null,
  lastSaved: null,
  
  moveCard: (cardId, fromColumn, toColumn, toIndex) => {
    const now = Date.now()
    
    set((state) => {
      const newColumns = state.columns.map(col => ({ ...col, cards: [...col.cards] }))
      
      const fromCol = newColumns.find(c => c.id === fromColumn)
      const toCol = newColumns.find(c => c.id === toColumn)
      
      if (!fromCol || !toCol) return state
      
      const cardIndex = fromCol.cards.findIndex(c => c.id === cardId)
      if (cardIndex === -1) return state
      
      const [card] = fromCol.cards.splice(cardIndex, 1)
      card.status = toColumn
      card.updatedAt = now
      
      // Track timestamps based on destination column
      if (toColumn === 'in-progress' && !card.startedAt) {
        card.startedAt = now
      } else if (toColumn === 'done' && !card.completedAt) {
        card.completedAt = now
        // Calculate time spent if we have startedAt
        if (card.startedAt) {
          card.timeSpent = (card.timeSpent || 0) + (now - card.startedAt)
        }
      }
      
      if (toIndex !== undefined) {
        toCol.cards.splice(toIndex, 0, card)
      } else {
        toCol.cards.push(card)
      }
      
      return { columns: newColumns }
    })
    
    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => get().saveToFile(), SAVE_DELAY)
  },
  
  reorderCard: (columnId, fromIndex, toIndex) => {
    set((state) => {
      const newColumns = state.columns.map(col => ({ ...col, cards: [...col.cards] }))
      const column = newColumns.find(c => c.id === columnId)
      
      if (!column) return state
      
      const [card] = column.cards.splice(fromIndex, 1)
      card.updatedAt = Date.now()
      column.cards.splice(toIndex, 0, card)
      
      return { columns: newColumns }
    })
    
    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => get().saveToFile(), SAVE_DELAY)
  },
  
  addCard: (card) => {
    const now = Date.now()
    const newCard = {
      ...card,
      createdAt: card.createdAt || now,
      updatedAt: now,
    }
    
    set((state) => {
      const newColumns = state.columns.map(col => {
        if (col.id === card.status) {
          return { ...col, cards: [...col.cards, newCard] }
        }
        return col
      })
      return { columns: newColumns }
    })
    
    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => get().saveToFile(), SAVE_DELAY)
  },
  
  updateCard: (cardId, updates) => {
    set((state) => {
      const newColumns = state.columns.map(col => ({
        ...col,
        cards: col.cards.map(card => 
          card.id === cardId ? { ...card, ...updates, updatedAt: Date.now() } : card
        ),
      }))
      return { columns: newColumns }
    })
    
    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => get().saveToFile(), SAVE_DELAY)
  },
  
  deleteCard: (cardId) => {
    set((state) => {
      const newColumns = state.columns.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId),
      }))
      return { columns: newColumns }
    })
    
    // Debounced auto-save
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => get().saveToFile(), SAVE_DELAY)
  },
  
  loadFromFile: async () => {
    set({ syncStatus: 'loading', syncError: null })
    
    const result = await readFile()
    
    if (result.success && result.content) {
      const cards = parseKanban(result.content)
      const columns = createColumnsFromCards(cards)
      set({ columns, syncStatus: 'idle' })
    } else if (result.error === 'File not found') {
      // Use default content
      const cards = parseKanban(DEFAULT_KANBAN)
      const columns = createColumnsFromCards(cards)
      set({ columns, syncStatus: 'idle' })
    } else {
      // Keep sample data, show error
      set({ syncStatus: 'error', syncError: result.error || 'Failed to load' })
    }
  },
  
  saveToFile: async () => {
    const { columns } = get()
    set({ syncStatus: 'saving' })
    
    const content = serializeKanban(columns)
    const result = await writeFile(content)
    
    if (result.success) {
      set({ syncStatus: 'saved', lastSaved: new Date() })
      // Reset to idle after showing "saved"
      setTimeout(() => set({ syncStatus: 'idle' }), 1500)
    } else {
      set({ syncStatus: 'error', syncError: result.error || 'Failed to save' })
    }
  },
  
  setColumns: (columns) => {
    set({ columns })
  },
}))
