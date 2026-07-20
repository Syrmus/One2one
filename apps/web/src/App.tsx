import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LibraryPage } from './pages/LibraryPage'
import { ReaderPage } from './pages/ReaderPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-svh bg-slate-50 dark:bg-slate-900">
        <Routes>
          <Route path="/" element={<LibraryPage />} />
          <Route path="/reader/:storyId" element={<ReaderPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
