import { useBoardStore } from '@/store'
import { Column } from './Column'

export function Board() {
  const columns = useBoardStore((state) => state.columns)

  return (
    <div className="min-h-screen bg-bg-deep p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-coral to-cyan flex items-center justify-center">
            <span className="text-white text-sm font-bold">K</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            OpenClaw Kanban
          </h1>
        </div>
        <p className="text-text-secondary text-sm">
          Drag tasks between columns to update their status
        </p>
      </header>

      {/* Board grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(column => (
          <Column key={column.id} column={column} />
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-text-muted text-xs">
        <p>Syncs with <code className="text-cyan">KANBAN.md</code> • Built for OpenClaw</p>
      </footer>
    </div>
  )
}
