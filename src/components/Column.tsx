import type { Column as ColumnType } from '@/types'
import { Card } from './Card'

interface ColumnProps {
  column: ColumnType
}

export function Column({ column }: ColumnProps) {
  return (
    <div 
      className="kanban-column"
      role="region"
      aria-label={`${column.title} column with ${column.cards.length} tasks`}
    >
      {/* Header */}
      <div 
        className="kanban-column__header"
        style={{ color: column.color }}
      >
        <div className="kanban-column__title-group">
          <span className="kanban-column__emoji" role="img" aria-hidden="true">
            {column.emoji}
          </span>
          <h3 className="kanban-column__title">
            {column.title}
          </h3>
        </div>
        <span className="kanban-column__count" aria-label={`${column.cards.length} tasks`}>
          {column.cards.length}
        </span>
      </div>

      {/* Cards container */}
      <div className="kanban-column__cards">
        {column.cards.map(card => (
          <Card key={card.id} card={card} />
        ))}
        
        {/* Empty state */}
        {column.cards.length === 0 && (
          <div className="kanban-empty-state">
            <span className="kanban-empty-state__icon">📋</span>
            <span>No tasks yet</span>
          </div>
        )}
      </div>

      {/* Add card button */}
      <button 
        className="kanban-add-btn"
        aria-label={`Add task to ${column.title}`}
      >
        <span className="kanban-add-btn__icon">+</span>
        Add task
      </button>
    </div>
  )
}
