# Spec: UI Design System

## Overview
Visual design matching openclaw.ai branding.

## Color Palette
```css
/* Backgrounds */
--bg-deep: #050810;      /* Page background */
--bg-surface: #0a0f1a;   /* Column background */
--bg-elevated: #111827;  /* Card background */

/* Accents */
--coral-bright: #ff4d4d; /* Primary action, urgent */
--coral-mid: #e63946;
--coral-dark: #991b1b;

--cyan-bright: #00e5cc;  /* Secondary, in-progress */
--cyan-mid: #14b8a6;

--green: #22c55e;        /* Done, success */
--purple: #a855f7;       /* New, special */

/* Text */
--text-primary: #f0f4ff;
--text-secondary: #8892b0;
--text-muted: #5a6480;

/* Borders */
--border-subtle: rgba(136, 146, 176, 0.15);
```

## Typography
```css
/* Fonts from Fontshare */
--font-display: 'Clash Display', system-ui, sans-serif;
--font-body: 'Satoshi', system-ui, sans-serif;
--font-mono: 'SF Mono', 'JetBrains Mono', monospace;

/* Sizes */
--text-xs: 10px;
--text-sm: 13px;
--text-base: 15px;
--text-lg: 18px;
--text-xl: 24px;
```

## Components

### Column
- Background: var(--bg-surface)
- Border: 1px solid var(--border-subtle)
- Border-radius: 12px
- Header border-bottom: 2px solid [column-color]

### Card
- Background: var(--bg-elevated)
- Border-radius: 8px
- Border-left: 3px solid [status-color]
- Padding: 12px
- Hover: translateY(-1px), shadow

### Tag
- Font-size: var(--text-xs)
- Padding: 2px 6px
- Border-radius: 4px
- Background: semi-transparent status color

## Layout
- Board: CSS Grid, 4 equal columns
- Responsive: Stack vertically on mobile
- Sidebar: Fixed 280px width on desktop

## Acceptance Criteria
- UI matches openclaw.ai aesthetic
- Dark theme only (no light mode)
- Fonts load from Fontshare CDN
