import { useEffect, useRef } from 'react';
import { useMissionStore } from '@/store';
import type { SSEEvent, Task } from '@/shared/types';

export function useSSE() {
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selectedTaskIdRef = useRef<string | undefined>(undefined);
  const { updateTask, addTask, removeTask, setIsOnline, selectedTask, setSelectedTask } = useMissionStore();

  useEffect(() => { selectedTaskIdRef.current = selectedTask?.id; }, [selectedTask]);

  useEffect(() => {
    let connecting = false;

    const connect = () => {
      if (connecting || esRef.current?.readyState === EventSource.OPEN) return;
      connecting = true;

      const es = new EventSource('/api/events/stream');
      esRef.current = es;

      es.onopen = () => { setIsOnline(true); connecting = false; };

      es.onmessage = (event) => {
        try {
          if (event.data.startsWith(':')) return;
          const sse: SSEEvent = JSON.parse(event.data);

          switch (sse.type) {
            case 'task_created': addTask(sse.payload as Task); break;
            case 'task_updated': {
              const t = sse.payload as Task;
              updateTask(t);
              if (selectedTaskIdRef.current === t.id) setSelectedTask(t);
              break;
            }
            case 'task_deleted': removeTask((sse.payload as { id: string }).id); break;
          }
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        setIsOnline(false);
        connecting = false;
        es.close();
        esRef.current = null;
        reconnectRef.current = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [addTask, updateTask, removeTask, setIsOnline, setSelectedTask]);
}
