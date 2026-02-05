import { useState, useEffect } from 'react'
import { AgentPanel } from './AgentPanel'
import { openclawAPI } from '@/lib/openclaw-api'

export function Sidebar() {
  const [connected, setConnected] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  useEffect(() => {
    // Check gateway connection
    const checkConnection = async () => {
      const status = await openclawAPI.getStatus()
      setConnected(status.connected)
    }
    
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])
  
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
      <div className={`sidebar__status ${connected ? 'sidebar__status--connected' : 'sidebar__status--disconnected'}`}>
        <span className="sidebar__status-dot" />
        {connected ? 'Gateway Connected' : 'Gateway Disconnected'}
      </div>
      
      {/* Quick Stats */}
      <div className="sidebar__section">
        <h3 className="sidebar__section-title">📊 Quick Stats</h3>
        <div className="sidebar__stats">
          <QuickStat label="Today" value="—" />
          <QuickStat label="In Progress" value="—" />
          <QuickStat label="Done (7d)" value="—" />
        </div>
      </div>
      
      {/* Agent Panel - for task assignment */}
      <AgentPanel />
      
      {/* Keyboard shortcuts hint */}
      <div className="sidebar__footer">
        <p className="sidebar__shortcut">
          <kbd>?</kbd> Keyboard shortcuts
        </p>
      </div>
    </aside>
  )
}

interface QuickStatProps {
  label: string
  value: string | number
}

function QuickStat({ label, value }: QuickStatProps) {
  return (
    <div className="quick-stat">
      <span className="quick-stat__value">{value}</span>
      <span className="quick-stat__label">{label}</span>
    </div>
  )
}
