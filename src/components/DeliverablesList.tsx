import { useEffect, useState, useCallback } from 'react';
import { FileText, Link as LinkIcon, Package, ExternalLink } from 'lucide-react';
import type { TaskDeliverable } from '@/shared/types';

interface Props {
  taskId: string;
}

const icons: Record<string, React.ReactNode> = {
  file: <FileText className="w-4 h-4" />,
  url: <LinkIcon className="w-4 h-4" />,
  artifact: <Package className="w-4 h-4" />,
};

export function DeliverablesList({ taskId }: Props) {
  const [deliverables, setDeliverables] = useState<TaskDeliverable[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/deliverables`);
      if (res.ok) setDeliverables(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center py-8 text-text-secondary text-sm">Loading deliverables...</div>;

  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-text-muted text-sm">
        <span className="text-3xl mb-2">📦</span>
        <span>No deliverables yet</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deliverables.map((d) => (
        <div key={d.id} className="flex gap-3 p-3 bg-bg-deep rounded-lg border border-border-subtle hover:border-accent/30 transition-colors">
          <div className="text-accent mt-0.5">{icons[d.deliverable_type] || icons.file}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium truncate">{d.title}</h4>
              {d.path && d.deliverable_type === 'url' && (
                <a href={d.path} target="_blank" rel="noopener noreferrer" className="text-accent">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            {d.description && <p className="text-xs text-text-muted mt-0.5">{d.description}</p>}
            {d.path && (
              <div className="mt-1 px-2 py-1 bg-bg-elevated rounded text-[10px] text-text-muted font-mono truncate">{d.path}</div>
            )}
            <div className="flex gap-3 mt-1 text-[10px] text-text-muted">
              <span className="capitalize">{d.deliverable_type}</span>
              <span>{new Date(d.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
