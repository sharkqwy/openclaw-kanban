import type { Column as ColumnType } from '@/types'
import { Card } from './Card'

interface ColumnProps {
  column: ColumnType
}

export function Column({ column }: ColumnProps) {
  return (
    <div className="flex flex-col bg-bg-surface rounded-xl border border-border-subtle min-h-[400px] max-h-[calc(100vh-160px)]">
      {/* Header */}
      <div 
        className="px-4 py-3 border-b-2 flex items-center justify-between"
        style={{ borderBottomColor: column.color }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{column.emoji}</span>
          <h3 className="font-display font-semibold text-text-primary">
            {column.title}
          </h3>
        </div>
        <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">
          {column.cards.length}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {column.cards.map(card => (
          <Card key={card.id} card={card} />
        ))}
        
        {/* Empty state */}
        {column.cards.length === 0 && (
          <div className="flex items-center justify-center h-24 text-text-muted text-sm border border-dashed border-border-subtle rounded-lg">
            No tasks
          </div>
        )}
      </div>

      {/* Add card button */}
      <div className="p-3 pt-0">
        <button className="w-full py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors">
          + Add task
        </button>
      </div>
    </div>
  )
}
