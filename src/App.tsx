import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireHostAccess } from './components/RequireHostAccess'
import { HomePage } from './pages/HomePage'
import { HostLoginPage } from './pages/HostLoginPage'
import { HostDashboardPage } from './pages/HostDashboardPage'
import { GameEditorPage } from './pages/GameEditorPage'
import { SessionPage } from './pages/SessionPage'
import { JoinPage } from './pages/JoinPage'
import { PlayPage } from './pages/PlayPage'
import { ResultsPage } from './pages/ResultsPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
          <Route path="/host/login" element={<HostLoginPage />} />
          <Route element={<RequireHostAccess />}>
            <Route path="/host/dashboard" element={<HostDashboardPage />} />
            <Route path="/host/games/:gameId" element={<GameEditorPage />} />
            <Route path="/host/sessions/:sessionId" element={<SessionPage />} />
          </Route>
          <Route path="/join" element={<JoinPage />} />
          <Route path="/play/:sessionId" element={<PlayPage />} />
          <Route path="/results/:sessionId" element={<ResultsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  )
}

export default App
