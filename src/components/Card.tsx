import type { Card as CardType } from '@/types'

interface CardProps {
  card: CardType
  isDragging?: boolean
}

const priorityColors = {
  high: 'bg-coral/20 text-coral',
  medium: 'bg-cyan/20 text-cyan',
  low: 'bg-text-secondary/20 text-text-secondary',
}

const tagColors: Record<string, string> = {
  'bug': 'bg-coral-dark/30 text-coral',
  'feature': 'bg-cyan/20 text-cyan',
  'docs': 'bg-purple/20 text-purple',
  'design': 'bg-purple/20 text-purple',
  'code-review': 'bg-cyan-mid/20 text-cyan-mid',
  'devops': 'bg-green/20 text-green',
  'setup': 'bg-text-muted/30 text-text-secondary',
  'architecture': 'bg-cyan/20 text-cyan',
}

export function Card({ card, isDragging }: CardProps) {
  const borderColor = card.priority === 'high' ? 'border-l-coral' 
    : card.priority === 'medium' ? 'border-l-cyan'
    : 'border-l-text-muted'

  return (
    <div
      className={`
        group relative
        bg-bg-elevated rounded-lg border-l-3 ${borderColor}
        p-3 cursor-grab active:cursor-grabbing
        transition-all duration-200 ease-out
        hover:-translate-y-0.5 hover:shadow-lg hover:shadow-bg-deep/50
        ${isDragging ? 'opacity-50 scale-105 shadow-xl rotate-2' : ''}
      `}
    >
      {/* Title */}
      <h4 className="text-sm font-medium text-text-primary leading-snug mb-2">
        {card.title}
      </h4>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.tags.map(tag => (
            <span
              key={tag}
              className={`
                text-[10px] px-1.5 py-0.5 rounded
                ${tagColors[tag] || 'bg-text-muted/30 text-text-secondary'}
              `}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks progress */}
      {card.subtasks && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <div className="flex-1 h-1 bg-bg-surface rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyan transition-all duration-300"
              style={{ width: `${(card.subtasks.completed / card.subtasks.total) * 100}%` }}
            />
          </div>
          <span className="text-[10px]">
            {card.subtasks.completed}/{card.subtasks.total}
          </span>
        </div>
      )}

      {/* Priority indicator */}
      {card.priority && (
        <span className={`
          absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded font-medium uppercase
          ${priorityColors[card.priority]}
        `}>
          {card.priority === 'high' ? '!' : card.priority === 'medium' ? '!!' : ''}
        </span>
      )}
    </div>
  )
}
