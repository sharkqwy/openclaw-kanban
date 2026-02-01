# Spec: OpenClaw Gateway Integration

## Overview
Connect to OpenClaw Gateway to show real-time agent activity and manage tasks.

## Requirements

### WebSocket Connection
- [ ] Connect to Gateway WebSocket (`ws://127.0.0.1:18789`)
- [ ] Authenticate with Bearer token
- [ ] Handle reconnection on disconnect
- [ ] Show connection status indicator

### Sessions Display
- [ ] List active sessions in sidebar
- [ ] Show session state (running, idle, waiting)
- [ ] Display last activity timestamp
- [ ] Link sessions to related tasks (if tagged)

### Activity Feed
- [ ] Show recent agent messages/actions
- [ ] Filter by session
- [ ] Auto-scroll to latest
- [ ] Limit to last N items (performance)

### Cron Integration (Phase 3)
- [ ] Create cron job from task
- [ ] Show scheduled tasks with next run time
- [ ] Enable/disable cron jobs
- [ ] Delete cron jobs

## API Endpoints

### Sessions
```typescript
// List sessions
await gateway.sessions_list({
  limit: 20,
  messageLimit: 5
});

// Response
interface Session {
  sessionKey: string;
  kind: string;
  state: 'idle' | 'running' | 'waiting';
  lastActivity: number;
  messages: Message[];
}
```

### Cron
```typescript
// List cron jobs
await gateway.cron({ action: 'list' });

// Add cron job
await gateway.cron({
  action: 'add',
  job: {
    name: 'Task reminder',
    schedule: { kind: 'at', atMs: timestamp },
    payload: { kind: 'systemEvent', text: '...' },
    sessionTarget: 'main'
  }
});
```

## Acceptance Criteria
- See active sessions in sidebar
- Connection status shows green when connected
- Creating a reminder task creates a cron job
