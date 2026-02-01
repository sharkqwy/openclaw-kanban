# Contributing to OpenClaw Kanban

Thank you for your interest in contributing! 🦞

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/openclaw-kanban`
3. Install dependencies: `pnpm install`
4. Start dev server: `pnpm dev`

## Development

### Tech Stack
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Zustand (state management)
- @dnd-kit (drag and drop)

### Commands
```bash
pnpm dev        # Start dev server
pnpm build      # Production build
pnpm typecheck  # Type checking
pnpm lint       # Linting
pnpm test       # Run tests
```

### Project Structure
```
src/
├── components/     # React components
├── hooks/          # Custom hooks
├── stores/         # Zustand stores
├── lib/            # Utilities
├── App.tsx
└── main.tsx
```

## Coding Guidelines

### Style
- Use TypeScript strict mode
- Follow existing code patterns
- Use Tailwind for styling (no custom CSS unless necessary)
- Keep components small and focused

### Commits
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add drag-and-drop support
fix: correct markdown parsing
docs: update README
refactor: simplify state management
```

### Pull Requests
1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Run checks: `pnpm typecheck && pnpm lint && pnpm build`
4. Commit with descriptive message
5. Push and open a PR

## Design System

Follow the [openclaw.ai](https://openclaw.ai) design:

### Colors
```css
--bg-deep: #050810;
--bg-surface: #0a0f1a;
--bg-elevated: #111827;
--coral-bright: #ff4d4d;
--cyan-bright: #00e5cc;
--text-primary: #f0f4ff;
```

### Fonts
- Display: Clash Display (Fontshare)
- Body: Satoshi (Fontshare)

## Questions?

- Open an issue for bugs or feature requests
- Join the [OpenClaw Discord](https://discord.com/invite/clawd)

---

Thanks for contributing! 🙏
