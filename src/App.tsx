import { useEffect } from 'react';
import { useMissionStore } from '@/store';
import { useSSE } from '@/hooks/useSSE';
import { Board } from '@/components/Board';
import { AgentsSidebar } from '@/components/AgentsSidebar';
import { LiveFeed } from '@/components/LiveFeed';
import { TaskModal } from '@/components/TaskModal';
import { Header } from '@/components/Header';

function App() {
  const { setTasks, setAgents, setEvents, setIsLoading, selectedTask, setSelectedTask } = useMissionStore();

  useSSE();

  useEffect(() => {
    async function load() {
      try {
        const [tasksRes, agentsRes, eventsRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/agents'),
          fetch('/api/events?limit=50'),
        ]);
        const [tasks, agents, events] = await Promise.all([
          tasksRes.json(),
          agentsRes.json(),
          eventsRes.json(),
        ]);
        setTasks(tasks);
        setAgents(agents);
        setEvents(events);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [setTasks, setAgents, setEvents, setIsLoading]);

  return (
    <div className="flex h-screen bg-bg-deep text-text-primary overflow-hidden">
      <AgentsSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <Board />
      </div>
      <LiveFeed />
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

export default App;
