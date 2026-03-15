import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useMissionStore } from '@/store';

export function QuickAdd() {
  const { addTask } = useMissionStore();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [focused, setFocused] = useState(false);

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
    <form onSubmit={handleSubmit} className="px-2.5 py-2">
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
        focused
          ? 'border-accent/40 bg-bg-deep shadow-[0_0_0_2px_var(--color-accent-glow)]'
          : 'border-border-subtle bg-bg-deep/50 hover:border-border-subtle'
      }`}>
        <Plus className={`w-3.5 h-3.5 shrink-0 transition-colors ${focused ? 'text-accent' : 'text-text-muted'}`} />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Quick add task..."
          className="flex-1 bg-transparent text-[12px] text-text-primary placeholder-text-muted/60 focus:outline-none"
          disabled={saving}
        />
      </div>
    </form>
  );
}