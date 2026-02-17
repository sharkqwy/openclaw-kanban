import { useEffect, useCallback, useState } from 'react';

interface Shortcut {
  key: string;
  description: string;
}

const SHORTCUTS: Shortcut[] = [
  { key: 'n', description: 'New task' },
  { key: '?', description: 'Show shortcuts' },
  { key: 'Escape', description: 'Close modal / deselect' },
];

export function useKeyboardShortcuts(callbacks: {
  onNewTask?: () => void;
  onCloseModal?: () => void;
}) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger in input/textarea
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    switch (e.key) {
      case 'n':
        e.preventDefault();
        callbacks.onNewTask?.();
        break;
      case '?':
        e.preventDefault();
        setShowHelp((p) => !p);
        break;
      case 'Escape':
        callbacks.onCloseModal?.();
        setShowHelp(false);
        break;
    }
  }, [callbacks]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp, shortcuts: SHORTCUTS };
}
