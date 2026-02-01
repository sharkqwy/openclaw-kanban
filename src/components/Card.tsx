import type { Card as CardType } from '@/types'

interface CardProps {
  card: CardType
  isDragging?: boolean
}

const tagClassMap: Record<string, string> = {
  'bug': 'kanban-tag--bug',
  'feature': 'kanban-tag--feature',
  'docs': 'kanban-tag--docs',
  'design': 'kanban-tag--design',
  'code-review': 'kanban-tag--feature',
  'devops': 'kanban-tag--devops',
  'setup': 'kanban-tag--default',
  'architecture': 'kanban-tag--feature',
}

export function Card({ card, isDragging }: CardProps) {
  const priorityClass = card.priority === 'high' 
    ? 'kanban-card--high-priority' 
    : card.priority === 'medium' 
      ? 'kanban-card--medium-priority'
      : 'kanban-card--low-priority'

  const progress = card.subtasks 
    ? Math.round((card.subtasks.completed / card.subtasks.total) * 100) 
    : 0

  return (
    <div
      className={`
        kanban-card ${priorityClass}
        ${isDragging ? 'kanban-card--dragging' : ''}
      `}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${card.title}${card.priority === 'high' ? ' - High priority' : ''}`}
    >
      {/* Priority indicator for high priority */}
      {card.priority === 'high' && (
        <span className="kanban-priority-badge kanban-priority-badge--high absolute top-2.5 right-2.5">
          urgent
        </span>
      )}

      {/* Title */}
      <h4 className="kanban-card__title pr-14">
        {card.title}
      </h4>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {card.tags.map(tag => (
            <span
              key={tag}
              className={`kanban-tag ${tagClassMap[tag] || 'kanban-tag--default'}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks progress */}
      {card.subtasks && (
        <div className="flex items-center gap-2.5">
          <div className="kanban-progress flex-1">
            <div 
              className="kanban-progress__bar"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <span className="text-[10px] font-medium text-text-secondary tabular-nums">
            {card.subtasks.completed}/{card.subtasks.total}
          </span>
        </div>
      )}
    </div>
  )
}
