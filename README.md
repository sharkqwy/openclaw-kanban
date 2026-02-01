# OpenClaw Kanban 🦞

> A visual kanban board natively integrated with [OpenClaw](https://github.com/openclaw/openclaw)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <img src="./assets/screenshot.png" alt="OpenClaw Kanban Screenshot" width="800">
</p>

## ✨ Features

- **📋 Visual Kanban Board** — Drag-and-drop task management
- **📝 Markdown Persistence** — Syncs with `KANBAN.md` (git-friendly)
- **🔗 OpenClaw Integration** — Real-time session/agent activity
- **⏰ Task Automation** — Create cron jobs from tasks
- **🎨 Beautiful UI** — Matches [openclaw.ai](https://openclaw.ai) design

## 🚀 Quick Start

### Option 1: npx (Recommended)
```bash
npx openclaw-kanban
```

### Option 2: Global Install
```bash
npm install -g openclaw-kanban
openclaw-kanban
```

### Option 3: From Source
```bash
git clone https://github.com/sharkqwy/openclaw-kanban
cd openclaw-kanban
pnpm install
pnpm dev
```

## 📖 How It Works

OpenClaw Kanban reads and writes to your `KANBAN.md` file:

```markdown
# KANBAN

## 📥 Inbox
- [ ] New task idea

## 🎯 Today
- [ ] Important task
- [x] Completed task ✓

## 🔄 In Progress
- [~] Currently working on

## ✅ Done
- [x] Finished task
```

Changes in the UI automatically sync to the file, and vice versa.

## 🔌 OpenClaw Integration

Connect to your running OpenClaw Gateway to:

- See active sessions and agents
- View real-time activity feed
- Create scheduled reminders (cron jobs)
- Link tasks to specific sessions

```bash
# Make sure OpenClaw Gateway is running
openclaw gateway status
```

## 🎨 Design

Built with the [openclaw.ai](https://openclaw.ai) design system:
- Dark theme with coral (#ff4d4d) and cyan (#00e5cc) accents
- Clash Display + Satoshi fonts
- Smooth animations and transitions

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    OpenClaw Kanban                       │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + Vite + Tailwind)                     │
│  - @dnd-kit for drag-and-drop                           │
│  - Zustand for state management                         │
│  - remark for markdown parsing                          │
├─────────────────────────────────────────────────────────┤
│  OpenClaw Gateway API                                   │
│  - WebSocket for real-time updates                      │
│  - sessions_list for active agents                      │
│  - cron for scheduled tasks                             │
├─────────────────────────────────────────────────────────┤
│  Storage: KANBAN.md                                     │
│  - Human-readable markdown                              │
│  - Git-friendly, diffable                               │
└─────────────────────────────────────────────────────────┘
```

## 🙏 Acknowledgments

This project is heavily inspired by and references:
- **[VibeKanban](https://github.com/BloopAI/vibe-kanban)** by BloopAI — The original kanban for AI coding agents
- **[OpenClaw](https://github.com/openclaw/openclaw)** — The AI assistant platform
- **[openclaw.ai](https://github.com/openclaw/openclaw.ai)** — Design system reference

## 📄 License

MIT © [OpenClaw Contributors](https://github.com/openclaw)

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

---

<p align="center">
  Made with 🦞 for the OpenClaw community
</p>
