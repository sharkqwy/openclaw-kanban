import type { Card, CardStatus, Column } from '@/types'
import { COLUMN_CONFIG } from '@/types'

/**
 * Parse a KANBAN.md file into board state
 * 
 * Format:
 * # Inbox
 * - [ ] Task one #tag
 * - [ ] Another task !high @session-name
 *   - Description or notes
 *   - Started: 2026-02-01 10:00
 */

interface ParsedCard {
  title: string
  status: CardStatus
  tags: string[]
  priority?: 'high' | 'medium' | 'low'
  done: boolean
  session?: string
  description?: string
  createdAt?: number
  startedAt?: number
  completedAt?: number
}

// Map headings to column IDs
const HEADING_TO_STATUS: Record<string, CardStatus> = {
  'inbox': 'inbox',
  'today': 'today',
  'in progress': 'in-progress',
  'in-progress': 'in-progress',
  'done': 'done',
  'completed': 'done',
}

// Extract tags from task text (e.g., #bug, #feature)
function extractTags(text: string): { clean: string; tags: string[] } {
  const tags: string[] = []
  const clean = text.replace(/#([\w-]+)/g, (_, tag) => {
    tags.push(tag.toLowerCase())
    return ''
  }).trim()
  return { clean, tags }
}

// Extract priority from task text (e.g., !high, !urgent)
function extractPriority(text: string): { clean: string; priority?: 'high' | 'medium' | 'low' } {
  let priority: 'high' | 'medium' | 'low' | undefined
  
  const clean = text
    .replace(/!(high|urgent)/gi, () => { priority = 'high'; return '' })
    .replace(/!(medium|mid)/gi, () => { priority = 'medium'; return '' })
    .replace(/!(low)/gi, () => { priority = 'low'; return '' })
    .trim()
  
  return { clean, priority }
}

// Extract session from task text (e.g., @main, @spawned-123)
function extractSession(text: string): { clean: string; session?: string } {
  let session: string | undefined
  
  const clean = text.replace(/@([\w-]+)/g, (_, s) => {
    session = s
    return ''
  }).trim()
  
  return { clean, session }
}

// Parse timestamp from string (e.g., "2026-02-01 10:00")
function parseTimestamp(str: string): number | undefined {
  const date = new Date(str.trim())
  return isNaN(date.getTime()) ? undefined : date.getTime()
}

// Parse a single task line
function parseTaskLine(line: string, status: CardStatus): ParsedCard | null {
  // Match: - [ ] task or - [x] task
  const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/)
  if (!match) return null
  
  const done = match[1].toLowerCase() === 'x'
  let text = match[2].trim()
  
  // Extract metadata
  const { clean: c1, tags } = extractTags(text)
  const { clean: c2, priority } = extractPriority(c1)
  const { clean: c3, session } = extractSession(c2)
  
  return {
    title: c3.trim(),
    status,
    tags,
    priority,
    done,
    session,
  }
}

// Parse indented lines for metadata
function parseMetadata(lines: string[]): Partial<ParsedCard> {
  const meta: Partial<ParsedCard> = {}
  const descLines: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('- ')) {
      const content = trimmed.slice(2).trim()
      
      // Check for metadata prefixes
      if (content.toLowerCase().startsWith('started:')) {
        meta.startedAt = parseTimestamp(content.slice(8))
      } else if (content.toLowerCase().startsWith('created:')) {
        meta.createdAt = parseTimestamp(content.slice(8))
      } else if (content.toLowerCase().startsWith('completed:')) {
        meta.completedAt = parseTimestamp(content.slice(10))
      } else if (content.toLowerCase().startsWith('session:')) {
        meta.session = content.slice(8).trim()
      } else {
        // Regular description line
        descLines.push(content)
      }
    }
  }
  
  if (descLines.length > 0) {
    meta.description = descLines.join('\n')
  }
  
  return meta
}

/**
 * Parse KANBAN.md content into cards
 */
export function parseKanban(content: string): Card[] {
  const lines = content.split('\n')
  const cards: Card[] = []
  let currentStatus: CardStatus | null = null
  let cardId = 1
  let currentCard: ParsedCard | null = null
  let metaLines: string[] = []
  
  const finalizeCard = () => {
    if (currentCard) {
      const meta = parseMetadata(metaLines)
      const finalStatus = currentCard.done ? 'done' : currentCard.status
      
      cards.push({
        id: `card-${cardId++}`,
        title: currentCard.title,
        status: finalStatus,
        tags: currentCard.tags.length > 0 ? currentCard.tags : undefined,
        priority: currentCard.priority,
        session: meta.session || currentCard.session,
        description: meta.description,
        createdAt: meta.createdAt,
        startedAt: meta.startedAt,
        completedAt: meta.completedAt,
      })
      
      currentCard = null
      metaLines = []
    }
  }
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check for heading
    const headingMatch = line.match(/^#+\s*(.+)$/)
    if (headingMatch) {
      finalizeCard()
      const heading = headingMatch[1].toLowerCase().trim()
      currentStatus = HEADING_TO_STATUS[heading] || null
      continue
    }
    
    // Check for task line
    if (currentStatus && line.match(/^-\s*\[/)) {
      finalizeCard()
      currentCard = parseTaskLine(line.trim(), currentStatus)
      continue
    }
    
    // Check for indented content (metadata/description)
    if (currentCard && (line.startsWith('  ') || line.startsWith('\t'))) {
      metaLines.push(line)
      continue
    }
  }
  
  // Finalize last card
  finalizeCard()
  
  return cards
}

/**
 * Convert board state back to KANBAN.md format
 */
export function serializeKanban(columns: Column[]): string {
  const sections: string[] = []
  
  // Order: Inbox, Today, In Progress, Done
  const order: CardStatus[] = ['inbox', 'today', 'in-progress', 'done']
  
  for (const status of order) {
    const column = columns.find(c => c.id === status)
    if (!column) continue
    
    const config = COLUMN_CONFIG[status]
    const lines: string[] = []
    
    // Heading
    lines.push(`# ${config.title}`)
    lines.push('')
    
    // Cards
    for (const card of column.cards) {
      const checkbox = status === 'done' ? '[x]' : '[ ]'
      let line = `- ${checkbox} ${card.title}`
      
      // Add tags
      if (card.tags && card.tags.length > 0) {
        line += ' ' + card.tags.map(t => `#${t}`).join(' ')
      }
      
      // Add priority
      if (card.priority && card.priority !== 'low') {
        line += ` !${card.priority}`
      }
      
      // Add session
      if (card.session) {
        line += ` @${card.session}`
      }
      
      lines.push(line)
      
      // Add metadata as indented lines
      if (card.description) {
        for (const descLine of card.description.split('\n')) {
          lines.push(`  - ${descLine}`)
        }
      }
      if (card.startedAt) {
        lines.push(`  - Started: ${formatTimestamp(card.startedAt)}`)
      }
      if (card.completedAt) {
        lines.push(`  - Completed: ${formatTimestamp(card.completedAt)}`)
      }
    }
    
    // Empty state
    if (column.cards.length === 0) {
      lines.push('<!-- No tasks -->')
    }
    
    lines.push('')
    sections.push(lines.join('\n'))
  }
  
  return sections.join('\n')
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return d.toISOString().slice(0, 16).replace('T', ' ')
}

/**
 * Create columns from parsed cards
 */
export function createColumnsFromCards(cards: Card[]): Column[] {
  const statuses: CardStatus[] = ['inbox', 'today', 'in-progress', 'done']
  
  return statuses.map(status => ({
    id: status,
    ...COLUMN_CONFIG[status],
    cards: cards.filter(card => card.status === status),
  }))
}

/**
 * Default KANBAN.md content
 */
export const DEFAULT_KANBAN = `# Inbox

- [ ] First task #example

# Today

<!-- No tasks -->

# In Progress

<!-- No tasks -->

# Done

<!-- No tasks -->
`
