import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMissionStore } from '@/store';

export function QuickAdd() {
  const { addTask } = useMissionStore();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), status: 'inbox' }),
      });
      if (res.ok) {
        const task = await res.json();
        addTask(task);
        setTitle('');
      }
    } catch (err) {
      console.error('Quick add failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 px-2 py-1.5">
      <Plus className="w-3.5 h-3.5 text-text-muted shrink-0" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add task..."
        className="flex-1 bg-transparent text-xs text-text-primary placeholder-text-muted focus:outline-none"
        disabled={saving}
      />
    </form>
  );
}
