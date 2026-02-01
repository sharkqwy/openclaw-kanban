import { useState, useCallback, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

import { useBoardStore } from '@/store'
import type { Card as CardType, CardStatus } from '@/types'
import { Column } from './Column'
import { Card } from './Card'
import { SyncIndicator } from './SyncIndicator'

export function Board() {
  const columns = useBoardStore((state) => state.columns)
  const moveCard = useBoardStore((state) => state.moveCard)
  const reorderCard = useBoardStore((state) => state.reorderCard)
  const loadFromFile = useBoardStore((state) => state.loadFromFile)
  
  // Load from file on mount
  useEffect(() => {
    loadFromFile()
  }, [loadFromFile])

  const [activeCard, setActiveCard] = useState<CardType | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const findCardById = useCallback((id: string): CardType | null => {
    for (const column of columns) {
      const card = column.cards.find(c => c.id === id)
      if (card) return card
    }
    return null
  }, [columns])

  const findColumnByCardId = useCallback((cardId: string): CardStatus | null => {
    for (const column of columns) {
      if (column.cards.some(c => c.id === cardId)) {
        return column.id
      }
    }
    return null
  }, [columns])

  const handleDragStart = (event: DragStartEvent) => {
    const card = findCardById(event.active.id as string)
    setActiveCard(card)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // We could handle real-time preview here if needed
    // For now, we just update on drag end
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeColumnId = findColumnByCardId(activeId)
    if (!activeColumnId) return

    // Check if dropping on a column or a card
    const isOverColumn = ['inbox', 'today', 'in-progress', 'done'].includes(overId)
    
    if (isOverColumn) {
      // Dropped directly on a column
      const targetColumnId = overId as CardStatus
      if (activeColumnId !== targetColumnId) {
        moveCard(activeId, activeColumnId, targetColumnId)
      }
    } else {
      // Dropped on another card
      const overColumnId = findColumnByCardId(overId)
      if (!overColumnId) return

      if (activeColumnId === overColumnId) {
        // Reordering within same column
        const column = columns.find(c => c.id === activeColumnId)
        if (!column) return

        const fromIndex = column.cards.findIndex(c => c.id === activeId)
        const toIndex = column.cards.findIndex(c => c.id === overId)

        if (fromIndex !== toIndex) {
          reorderCard(activeColumnId, fromIndex, toIndex)
        }
      } else {
        // Moving to different column
        const toColumn = columns.find(c => c.id === overColumnId)
        if (!toColumn) return

        const toIndex = toColumn.cards.findIndex(c => c.id === overId)
        moveCard(activeId, activeColumnId, overColumnId, toIndex)
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-bg-deep p-6 lg:p-8">
        {/* Header */}
        <header className="kanban-header">
          <div className="kanban-header__top">
            <div className="kanban-header__logo">
              K
            </div>
            <h1 className="kanban-header__title">
              OpenClaw Kanban
            </h1>
            <SyncIndicator />
          </div>
          <p className="kanban-header__subtitle">
            Drag tasks between columns to update their status
          </p>
        </header>

        {/* Board grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
          role="main"
          aria-label="Kanban board"
        >
          {columns.map(column => (
            <Column key={column.id} column={column} />
          ))}
        </div>

        {/* Footer */}
        <footer className="kanban-footer">
          <p>
            Syncs with <code>KANBAN.md</code> • Built for OpenClaw
          </p>
        </footer>
      </div>

      {/* Drag overlay - shows card being dragged */}
      <DragOverlay>
        {activeCard ? (
          <Card card={activeCard} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
