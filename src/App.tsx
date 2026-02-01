import { Board } from '@/components'
import { Sidebar } from '@/components/Sidebar'

function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Board />
      </main>
    </div>
  )
}

export default App
