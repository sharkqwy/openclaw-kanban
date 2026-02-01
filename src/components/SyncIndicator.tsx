import { useBoardStore } from '@/store'

export function SyncIndicator() {
  const syncStatus = useBoardStore((state) => state.syncStatus)
  const syncError = useBoardStore((state) => state.syncError)
  
  const getIcon = () => {
    switch (syncStatus) {
      case 'loading':
        return '⏳'
      case 'saving':
        return '💾'
      case 'saved':
        return '✓'
      case 'error':
        return '⚠️'
      default:
        return '☁️'
    }
  }
  
  const getText = () => {
    switch (syncStatus) {
      case 'loading':
        return 'Loading...'
      case 'saving':
        return 'Saving...'
      case 'saved':
        return 'Saved'
      case 'error':
        return syncError || 'Error'
      default:
        return 'Synced'
    }
  }
  
  const getClass = () => {
    const base = 'sync-indicator'
    switch (syncStatus) {
      case 'loading':
      case 'saving':
        return `${base} sync-indicator--loading`
      case 'saved':
        return `${base} sync-indicator--saved`
      case 'error':
        return `${base} sync-indicator--error`
      default:
        return base
    }
  }
  
  return (
    <div className={getClass()} title={syncError || undefined}>
      <span className="sync-indicator__icon">{getIcon()}</span>
      <span className="sync-indicator__text">{getText()}</span>
    </div>
  )
}
