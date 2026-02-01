/**
 * OpenClaw Gateway client
 * Connects to the Gateway WebSocket for real-time session info
 */

export interface GatewaySession {
  key: string
  kind: 'main' | 'spawned' | 'cron'
  model?: string
  lastActivity?: number
  channel?: string
}

export interface GatewayState {
  connected: boolean
  sessions: GatewaySession[]
  error: string | null
}

export type GatewayListener = (state: GatewayState) => void

const DEFAULT_URL = 'ws://127.0.0.1:18789'

class GatewayClient {
  private ws: WebSocket | null = null
  private url: string = DEFAULT_URL
  private listeners: Set<GatewayListener> = new Set()
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private state: GatewayState = {
    connected: false,
    sessions: [],
    error: null,
  }
  
  /**
   * Configure the gateway URL
   */
  configure(url: string) {
    this.url = url
  }
  
  /**
   * Connect to the gateway
   */
  connect() {
    if (this.ws) {
      return
    }
    
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        this.updateState({ connected: true, error: null })
        // Request session list
        this.send({ type: 'sessions.list' })
      }
      
      this.ws.onclose = () => {
        this.ws = null
        this.updateState({ connected: false })
        this.scheduleReconnect()
      }
      
      this.ws.onerror = (event) => {
        console.error('Gateway WebSocket error:', event)
        this.updateState({ error: 'Connection error' })
      }
      
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          this.handleMessage(msg)
        } catch (err) {
          console.error('Failed to parse gateway message:', err)
        }
      }
    } catch (err) {
      this.updateState({ error: `Failed to connect: ${err}` })
      this.scheduleReconnect()
    }
  }
  
  /**
   * Disconnect from the gateway
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.updateState({ connected: false })
  }
  
  /**
   * Subscribe to state updates
   */
  subscribe(listener: GatewayListener): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.state)
    
    return () => {
      this.listeners.delete(listener)
    }
  }
  
  /**
   * Get current state
   */
  getState(): GatewayState {
    return this.state
  }
  
  private send(msg: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }
  
  private handleMessage(msg: any) {
    if (msg.type === 'sessions.list.result') {
      const sessions: GatewaySession[] = (msg.sessions || []).map((s: any) => ({
        key: s.key || s.sessionKey,
        kind: s.kind || 'main',
        model: s.model,
        lastActivity: s.lastActivity,
        channel: s.channel,
      }))
      this.updateState({ sessions })
    } else if (msg.type === 'session.activity') {
      // Real-time activity update
      const { sessionKey, ...update } = msg
      this.updateState({
        sessions: this.state.sessions.map(s =>
          s.key === sessionKey ? { ...s, ...update, lastActivity: Date.now() } : s
        ),
      })
    }
  }
  
  private updateState(partial: Partial<GatewayState>) {
    this.state = { ...this.state, ...partial }
    this.listeners.forEach(listener => listener(this.state))
  }
  
  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      return
    }
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null
      this.connect()
    }, 3000)
  }
}

// Singleton instance
export const gateway = new GatewayClient()
