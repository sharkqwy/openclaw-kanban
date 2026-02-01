import { useState, useEffect } from 'react'
import { gateway, type GatewayState, type GatewaySession } from '@/lib/gateway'

export function Sidebar() {
  const [state, setState] = useState<GatewayState>(() => gateway.getState())
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  useEffect(() => {
    // Subscribe to gateway state
    const unsubscribe = gateway.subscribe(setState)
    
    // Connect to gateway
    gateway.connect()
    
    return () => {
      unsubscribe()
    }
  }, [])
  
  const formatRelativeTime = (ms?: number) => {
    if (!ms) return 'Unknown'
    const seconds = Math.floor((Date.now() - ms) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }
  
  const getKindEmoji = (kind: string) => {
    switch (kind) {
      case 'main': return '🏠'
      case 'spawned': return '🚀'
      case 'cron': return '⏰'
      default: return '📋'
    }
  }
  
  if (isCollapsed) {
    return (
      <div className="sidebar sidebar--collapsed">
        <button
          className="sidebar__toggle"
          onClick={() => setIsCollapsed(false)}
          aria-label="Expand sidebar"
        >
          ◀
        </button>
      </div>
    )
  }
  
  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h2 className="sidebar__title">
          <span className="sidebar__logo">⚡</span>
          OpenClaw
        </h2>
        <button
          className="sidebar__toggle"
          onClick={() => setIsCollapsed(true)}
          aria-label="Collapse sidebar"
        >
          ▶
        </button>
      </div>
      
      {/* Connection status */}
      <div className={`sidebar__status ${state.connected ? 'sidebar__status--connected' : 'sidebar__status--disconnected'}`}>
        <span className="sidebar__status-dot" />
        {state.connected ? 'Connected' : 'Disconnected'}
      </div>
      
      {state.error && (
        <div className="sidebar__error">
          {state.error}
        </div>
      )}
      
      {/* Sessions list */}
      <div className="sidebar__section">
        <h3 className="sidebar__section-title">Active Sessions</h3>
        
        {state.sessions.length === 0 ? (
          <p className="sidebar__empty">
            {state.connected ? 'No active sessions' : 'Connect to see sessions'}
          </p>
        ) : (
          <ul className="sidebar__sessions">
            {state.sessions.map((session) => (
              <SessionItem key={session.key} session={session} formatTime={formatRelativeTime} getEmoji={getKindEmoji} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}

interface SessionItemProps {
  session: GatewaySession
  formatTime: (ms?: number) => string
  getEmoji: (kind: string) => string
}

function SessionItem({ session, formatTime, getEmoji }: SessionItemProps) {
  return (
    <li className="sidebar__session">
      <div className="sidebar__session-header">
        <span className="sidebar__session-emoji">{getEmoji(session.kind)}</span>
        <span className="sidebar__session-key">{session.key}</span>
      </div>
      <div className="sidebar__session-meta">
        {session.model && (
          <span className="sidebar__session-model">{session.model}</span>
        )}
        {session.channel && (
          <span className="sidebar__session-channel">{session.channel}</span>
        )}
        <span className="sidebar__session-time">{formatTime(session.lastActivity)}</span>
      </div>
    </li>
  )
}
