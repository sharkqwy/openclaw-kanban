import { useBoardStore } from '@/store'
import { Column } from './Column'

export function Board() {
  const columns = useBoardStore((state) => state.columns)

  return (
    <div className="min-h-screen bg-bg-deep p-6 lg:p-8">
      {/* Header */}
      <header className="kanban-header">
        <div className="kanban-header__top">
          <div className="kanban-header__logo">
            K
          </div>
          <h1 className="kanban-header__title">
            OpenClaw Kanban
          </h1>
        </div>
        <p className="kanban-header__subtitle">
          Drag tasks between columns to update their status
        </p>
      </header>

      {/* Board grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        role="main"
        aria-label="Kanban board"
      >
        {columns.map(column => (
          <Column key={column.id} column={column} />
        ))}
      </div>

      {/* Footer */}
      <footer className="kanban-footer">
        <p>
          Syncs with <code>KANBAN.md</code> • Built for OpenClaw
        </p>
      </footer>
    </div>
  )
}
