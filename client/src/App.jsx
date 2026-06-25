import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import BrainDumpPage from './pages/BrainDumpPage.jsx'
import TasksPage from './pages/TasksPage.jsx'
import { useAuthBootstrap } from './features/auth/useAuthBootstrap.js'


export default function App() {
  useAuthBootstrap()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/brain-dump" element={<BrainDumpPage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </BrowserRouter>
  )
}





