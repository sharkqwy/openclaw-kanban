/**
 * OpenClaw API Client
 * HTTP API calls to interact with OpenClaw Gateway
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:18789'

export interface OpenClawSession {
  key: string
  kind: 'main' | 'group' | 'dm' | 'spawned' | 'other'
  channel?: string
  displayName?: string
  model?: string
  updatedAt?: number
  sessionId?: string
  totalTokens?: number
  lastChannel?: string
  messages?: Array<{
    role: string
    content: any
    timestamp?: number
  }>
}

export interface SessionsListResponse {
  count: number
  sessions: OpenClawSession[]
}

export interface CronJob {
  id: string
  name?: string
  schedule: {
    kind: 'at' | 'every' | 'cron'
    atMs?: number
    everyMs?: number
    expr?: string
    tz?: string
  }
  payload: {
    kind: 'systemEvent' | 'agentTurn'
    text?: string
    message?: string
  }
  sessionTarget: 'main' | 'isolated'
  enabled: boolean
  lastRun?: number
  nextRun?: number
}

export interface CronListResponse {
  jobs: CronJob[]
}

class OpenClawAPI {
  private baseUrl: string
  private token?: string
  
  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl
  }
  
  configure(options: { baseUrl?: string; token?: string }) {
    if (options.baseUrl) this.baseUrl = options.baseUrl
    if (options.token) this.token = options.token
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
  
  /**
   * List active sessions
   */
  async listSessions(limit = 20, messageLimit = 0): Promise<SessionsListResponse> {
    return this.request<SessionsListResponse>(
      `/api/sessions?limit=${limit}&messageLimit=${messageLimit}`
    )
  }
  
  /**
   * Send a message to a session
   */
  async sendToSession(sessionKey: string, message: string): Promise<{ ok: boolean }> {
    return this.request('/api/sessions/send', {
      method: 'POST',
      body: JSON.stringify({ sessionKey, message }),
    })
  }
  
  /**
   * Get session history
   */
  async getSessionHistory(sessionKey: string, limit = 20): Promise<{ messages: any[] }> {
    return this.request(`/api/sessions/${encodeURIComponent(sessionKey)}/history?limit=${limit}`)
  }
  
  /**
   * List cron jobs
   */
  async listCronJobs(includeDisabled = false): Promise<CronListResponse> {
    return this.request<CronListResponse>(
      `/api/cron/jobs?includeDisabled=${includeDisabled}`
    )
  }
  
  /**
   * Create a cron job
   */
  async createCronJob(job: Omit<CronJob, 'id'>): Promise<CronJob> {
    return this.request('/api/cron/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    })
  }
  
  /**
   * Delete a cron job
   */
  async deleteCronJob(jobId: string): Promise<{ ok: boolean }> {
    return this.request(`/api/cron/jobs/${jobId}`, {
      method: 'DELETE',
    })
  }
  
  /**
   * Run a cron job immediately
   */
  async runCronJob(jobId: string): Promise<{ ok: boolean }> {
    return this.request(`/api/cron/jobs/${jobId}/run`, {
      method: 'POST',
    })
  }
  
  /**
   * Get gateway status
   */
  async getStatus(): Promise<{ connected: boolean; version?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`)
      return { connected: response.ok }
    } catch {
      return { connected: false }
    }
  }
}

// Singleton instance
export const openclawAPI = new OpenClawAPI()
