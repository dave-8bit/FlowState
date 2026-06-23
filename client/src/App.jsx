import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import BrainDumpPage from './pages/BrainDumpPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/brain-dump" element={<BrainDumpPage />} />
      </Routes>
    </BrowserRouter>
  )
}


