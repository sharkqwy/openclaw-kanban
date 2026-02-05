import { useState, useEffect, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { openclawAPI, type OpenClawSession } from '@/lib/openclaw-api'

interface AgentPanelProps {
  onAssignTask?: (sessionKey: string, taskTitle: string) => void
}

// Extract agent name from session key
function getAgentName(session: OpenClawSession): string {
  // session.key format: "agent:name:channel:..." or "main:..."
  const parts = session.key.split(':')
  if (parts[0] === 'agent' && parts[1]) {
    return parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
  }
  return session.displayName || session.key.split(':')[0]
}

// Get agent color based on name hash
function getAgentColor(name: string): string {
  const colors = [
    '#ff4d4d', // coral
    '#00e5cc', // cyan
    '#a855f7', // purple
    '#f59e0b', // amber
    '#22c55e', // green
    '#3b82f6', // blue
    '#ec4899', // pink
  ]
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Get agent emoji based on role
function getAgentEmoji(session: OpenClawSession): string {
  const name = getAgentName(session).toLowerCase()
  const emojiMap: Record<string, string> = {
    'builder': '🦾',
    'marcus': '🦾',
    'strategist': '🎯',
    'ethan': '🎯',
    'creator': '🎨',
    'sophia': '🎨',
    'guardian': '🛡️',
    'noah': '🛡️',
    'daemon': '⚙️',
    'monk': '⚙️',
    'chief-of-staff': '📋',
    'alex': '📋',
    'cfo': '💰',
    'victor': '💰',
    'ambassador': '🌐',
    'mira': '🌐',
    'main': '🏠',
  }
  return emojiMap[name] || '🤖'
}

function AgentCard({ session }: { session: OpenClawSession }) {
  const name = getAgentName(session)
  const color = getAgentColor(name)
  const emoji = getAgentEmoji(session)
  
  const { setNodeRef, isOver } = useDroppable({
    id: `agent-${session.key}`,
    data: { type: 'agent', session },
  })
  
  const formatTime = (ms?: number) => {
    if (!ms) return ''
    const diff = Date.now() - ms
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return `${Math.floor(diff / 86400000)}d`
  }
  
  return (
    <div
      ref={setNodeRef}
      className={`agent-card ${isOver ? 'agent-card--drop-target' : ''}`}
      style={{ '--agent-color': color } as React.CSSProperties}
    >
      <div className="agent-card__header">
        <span className="agent-card__emoji">{emoji}</span>
        <span className="agent-card__name">{name}</span>
        {session.updatedAt && (
          <span className="agent-card__time">{formatTime(session.updatedAt)}</span>
        )}
      </div>
      
      <div className="agent-card__meta">
        {session.channel && (
          <span className="agent-card__channel">#{session.channel}</span>
        )}
        {session.model && (
          <span className="agent-card__model">{session.model.split('/').pop()}</span>
        )}
      </div>
      
      {isOver && (
        <div className="agent-card__drop-hint">
          📌 Drop to assign
        </div>
      )}
    </div>
  )
}

export function AgentPanel({ onAssignTask: _onAssignTask }: AgentPanelProps) {
  const [sessions, setSessions] = useState<OpenClawSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  
  const fetchSessions = useCallback(async () => {
    try {
      const status = await openclawAPI.getStatus()
      setConnected(status.connected)
      
      if (!status.connected) {
        setError('Gateway not connected')
        return
      }
      
      const response = await openclawAPI.listSessions(20, 1)
      
      // Filter to show only agent sessions
      const agentSessions = response.sessions.filter(s => 
        s.key.startsWith('agent:') || s.kind === 'group'
      )
      
      setSessions(agentSessions)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
    } finally {
      setLoading(false)
    }
  }, [])
  
  useEffect(() => {
    fetchSessions()
    
    // Poll every 30 seconds
    const interval = setInterval(fetchSessions, 30000)
    return () => clearInterval(interval)
  }, [fetchSessions])
  
  // Group sessions by agent
  const agentGroups = sessions.reduce<Record<string, OpenClawSession[]>>((acc, session) => {
    const name = getAgentName(session)
    if (!acc[name]) acc[name] = []
    acc[name].push(session)
    return acc
  }, {})
  
  return (
    <div className="agent-panel">
      <div className="agent-panel__header">
        <h3 className="agent-panel__title">
          🤖 Agents
          <span className={`agent-panel__status ${connected ? 'connected' : 'disconnected'}`} />
        </h3>
        <button 
          className="agent-panel__refresh"
          onClick={fetchSessions}
          title="Refresh"
        >
          ↻
        </button>
      </div>
      
      {loading ? (
        <div className="agent-panel__loading">Loading...</div>
      ) : error ? (
        <div className="agent-panel__error">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="agent-panel__empty">No active agents</div>
      ) : (
        <div className="agent-panel__list">
          {Object.entries(agentGroups).map(([name, groupSessions]) => (
            <div key={name} className="agent-group">
              {groupSessions.map(session => (
                <AgentCard key={session.key} session={session} />
              ))}
            </div>
          ))}
        </div>
      )}
      
      <div className="agent-panel__hint">
        Drag tasks here to assign
      </div>
    </div>
  )
}
