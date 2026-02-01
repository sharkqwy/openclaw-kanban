import type { Card, CardStatus, Column } from '@/types'
import { COLUMN_CONFIG } from '@/types'

/**
 * Parse a KANBAN.md file into board state
 * 
 * Expected format:
 * # Inbox
 * - [ ] Task one
 * - [ ] Another task #tag
 * 
 * # Today
 * - [ ] Do this !high
 * - [x] Done task
 */

interface ParsedCard {
  title: string
  status: CardStatus
  tags: string[]
  priority?: 'high' | 'medium' | 'low'
  done: boolean
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
  const clean = text.replace(/#(\w+)/g, (_, tag) => {
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

// Parse a single task line
function parseTaskLine(line: string, status: CardStatus): ParsedCard | null {
  // Match: - [ ] task or - [x] task
  const match = line.match(/^-\s*\[([ xX])\]\s*(.+)$/)
  if (!match) return null
  
  const done = match[1].toLowerCase() === 'x'
  let text = match[2].trim()
  
  // Extract tags
  const { clean: cleanTags, tags } = extractTags(text)
  text = cleanTags
  
  // Extract priority
  const { clean: cleanPriority, priority } = extractPriority(text)
  text = cleanPriority
  
  return {
    title: text,
    status,
    tags,
    priority,
    done,
  }
}

/**
 * Parse KANBAN.md content into cards
 */
export function parseKanban(content: string): Card[] {
  const lines = content.split('\n')
  const cards: Card[] = []
  let currentStatus: CardStatus | null = null
  let cardId = 1
  
  for (const line of lines) {
    // Check for heading
    const headingMatch = line.match(/^#+\s*(.+)$/)
    if (headingMatch) {
      const heading = headingMatch[1].toLowerCase().trim()
      currentStatus = HEADING_TO_STATUS[heading] || null
      continue
    }
    
    // Parse task if we're in a valid section
    if (currentStatus) {
      const parsed = parseTaskLine(line.trim(), currentStatus)
      if (parsed) {
        // If task is marked done, override status to 'done'
        const finalStatus = parsed.done ? 'done' : parsed.status
        
        cards.push({
          id: `card-${cardId++}`,
          title: parsed.title,
          status: finalStatus,
          tags: parsed.tags.length > 0 ? parsed.tags : undefined,
          priority: parsed.priority,
        })
      }
    }
  }
  
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
      
      lines.push(line)
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
