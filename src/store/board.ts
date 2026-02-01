import { create } from 'zustand'
import type { Card, CardStatus, Column } from '@/types'
import { COLUMN_CONFIG } from '@/types'

// Sample data for initial development
const SAMPLE_CARDS: Card[] = [
  { id: '1', title: 'Review PR #42 - API refactor', status: 'inbox', tags: ['code-review'], priority: 'high' },
  { id: '2', title: 'Update documentation for new features', status: 'inbox', tags: ['docs'] },
  { id: '3', title: 'Fix auth token refresh issue', status: 'today', tags: ['bug'], priority: 'high' },
  { id: '4', title: 'Design new dashboard layout', status: 'today', tags: ['design'] },
  { id: '5', title: 'Implement drag-and-drop', status: 'in-progress', tags: ['feature'], subtasks: { total: 5, completed: 3 } },
  { id: '6', title: 'Set up CI/CD pipeline', status: 'in-progress', tags: ['devops'] },
  { id: '7', title: 'Initialize project repository', status: 'done', tags: ['setup'] },
  { id: '8', title: 'Create component architecture', status: 'done', tags: ['architecture'] },
]

function createColumns(cards: Card[]): Column[] {
  const statuses: CardStatus[] = ['inbox', 'today', 'in-progress', 'done']
  
  return statuses.map(status => ({
    id: status,
    ...COLUMN_CONFIG[status],
    cards: cards.filter(card => card.status === status),
  }))
}

interface BoardStore {
  columns: Column[]
  
  // Actions
  moveCard: (cardId: string, fromColumn: CardStatus, toColumn: CardStatus, toIndex?: number) => void
  reorderCard: (columnId: CardStatus, fromIndex: number, toIndex: number) => void
  addCard: (card: Card) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  deleteCard: (cardId: string) => void
}

export const useBoardStore = create<BoardStore>((set) => ({
  columns: createColumns(SAMPLE_CARDS),
  
  moveCard: (cardId, fromColumn, toColumn, toIndex) => {
    set((state) => {
      const newColumns = state.columns.map(col => ({ ...col, cards: [...col.cards] }))
      
      const fromCol = newColumns.find(c => c.id === fromColumn)
      const toCol = newColumns.find(c => c.id === toColumn)
      
      if (!fromCol || !toCol) return state
      
      const cardIndex = fromCol.cards.findIndex(c => c.id === cardId)
      if (cardIndex === -1) return state
      
      const [card] = fromCol.cards.splice(cardIndex, 1)
      card.status = toColumn
      
      if (toIndex !== undefined) {
        toCol.cards.splice(toIndex, 0, card)
      } else {
        toCol.cards.push(card)
      }
      
      return { columns: newColumns }
    })
  },
  
  reorderCard: (columnId, fromIndex, toIndex) => {
    set((state) => {
      const newColumns = state.columns.map(col => ({ ...col, cards: [...col.cards] }))
      const column = newColumns.find(c => c.id === columnId)
      
      if (!column) return state
      
      const [card] = column.cards.splice(fromIndex, 1)
      column.cards.splice(toIndex, 0, card)
      
      return { columns: newColumns }
    })
  },
  
  addCard: (card) => {
    set((state) => {
      const newColumns = state.columns.map(col => {
        if (col.id === card.status) {
          return { ...col, cards: [...col.cards, card] }
        }
        return col
      })
      return { columns: newColumns }
    })
  },
  
  updateCard: (cardId, updates) => {
    set((state) => {
      const newColumns = state.columns.map(col => ({
        ...col,
        cards: col.cards.map(card => 
          card.id === cardId ? { ...card, ...updates } : card
        ),
      }))
      return { columns: newColumns }
    })
  },
  
  deleteCard: (cardId) => {
    set((state) => {
      const newColumns = state.columns.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId),
      }))
      return { columns: newColumns }
    })
  },
}))
