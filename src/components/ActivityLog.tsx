import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { TaskActivity } from '@/shared/types';

interface Props {
  taskId: string;
}

const activityIcons: Record<string, string> = {
  spawned: '🚀',
  updated: '✏️',
  completed: '✅',
  file_created: '📄',
  status_changed: '🔄',
};

export function ActivityLog({ taskId }: Props) {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/activities`);
      if (res.ok) setActivities(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <div className="text-center py-8 text-text-secondary text-sm">Loading activities...</div>;

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-text-muted text-sm">
        <span className="text-3xl mb-2">📝</span>
        <span>No activity yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((a) => (
        <div key={a.id} className="flex gap-3 p-3 bg-bg-deep rounded-lg border border-border-subtle">
          <span className="text-lg">{activityIcons[a.activity_type] || '📝'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{a.message}</p>
            {a.metadata && (
              <pre className="mt-1 p-2 bg-bg-elevated rounded text-[10px] text-text-muted overflow-x-auto">
                {typeof a.metadata === 'string' ? a.metadata : JSON.stringify(a.metadata, null, 2)}
              </pre>
            )}
            <span className="text-[10px] text-text-muted mt-1 block">
              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
