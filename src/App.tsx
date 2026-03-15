import { useEffect } from 'react';
import { useMissionStore } from '@/store';
import { useSSE } from '@/hooks/useSSE';
import { NavRail } from '@/components/NavRail';
import { Dashboard } from '@/components/Dashboard';
import { BoardView } from '@/components/BoardView';
import { AgentsPanel } from '@/components/AgentsPanel';
import { ActivityPanel } from '@/components/ActivityPanel';
import { LiveFeed } from '@/components/LiveFeed';
import { TaskModal } from '@/components/TaskModal';

function App() {
  const { setTasks, setAgents, setEvents, setIsLoading, selectedTask, setSelectedTask, activePanel, showLiveFeed } = useMissionStore();

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

  const renderPanel = () => {
    switch (activePanel) {
      case 'dashboard':
        return <Dashboard />;
      case 'board':
        return <BoardView />;
      case 'agents':
        return <AgentsPanel />;
      case 'activity':
        return <ActivityPanel />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-bg-deep text-text-primary overflow-hidden">
      <NavRail />
      {renderPanel()}
      {showLiveFeed && <LiveFeed />}
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}

export default App;
