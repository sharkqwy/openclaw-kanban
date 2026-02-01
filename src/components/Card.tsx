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
  'project': 'kanban-tag--project',
  'building': 'kanban-tag--building',
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

function formatRelativeTime(ts?: number): string {
  if (!ts) return ''
  const diff = Date.now() - ts
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
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

  // Calculate active time for in-progress cards
  const activeTime = card.status === 'in-progress' && card.startedAt
    ? Date.now() - card.startedAt + (card.timeSpent || 0)
    : card.timeSpent

  return (
    <div
      className={`
        kanban-card ${priorityClass}
        ${isDragging ? 'kanban-card--dragging' : ''}
        ${card.session ? 'kanban-card--has-session' : ''}
      `}
      tabIndex={0}
      role="button"
      aria-label={`Task: ${card.title}${card.priority === 'high' ? ' - High priority' : ''}`}
      aria-grabbed={isDragging}
    >
      {/* Priority indicator for high priority */}
      {card.priority === 'high' && (
        <span className="kanban-priority-badge kanban-priority-badge--high absolute top-2.5 right-2.5">
          urgent
        </span>
      )}

      {/* Session badge */}
      {card.session && (
        <span className="kanban-session-badge">
          @{card.session}
        </span>
      )}

      {/* Title */}
      <h4 className="kanban-card__title pr-14">
        {card.title}
      </h4>

      {/* Description preview */}
      {card.description && (
        <p className="kanban-card__description">
          {card.description.split('\n')[0]}
        </p>
      )}

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
        <div className="flex items-center gap-2.5 mb-2">
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

      {/* Time tracking footer */}
      {(activeTime || card.startedAt || card.completedAt) && (
        <div className="kanban-card__meta">
          {activeTime && activeTime > 0 && (
            <span className="kanban-card__time" title="Time spent">
              ⏱ {formatDuration(activeTime)}
            </span>
          )}
          {card.status === 'in-progress' && card.startedAt && (
            <span className="kanban-card__started" title="Started">
              ▶ {formatRelativeTime(card.startedAt)}
            </span>
          )}
          {card.status === 'done' && card.completedAt && (
            <span className="kanban-card__completed" title="Completed">
              ✓ {formatRelativeTime(card.completedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
