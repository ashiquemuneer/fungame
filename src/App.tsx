import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HostLayout } from './components/HostLayout'
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
      <Routes>
        {/* ── Public routes — keep existing AppShell top-nav ── */}
        <Route element={<AppShell><Routes><Route index element={<HomePage />} /></Routes></AppShell>} path="/" />
        <Route path="/join" element={<AppShell><JoinPage /></AppShell>} />
        <Route path="/play/:sessionId" element={<AppShell><PlayPage /></AppShell>} />
        <Route path="/results/:sessionId" element={<AppShell><ResultsPage /></AppShell>} />

        {/* ── Host routes — Mentimeter-style sidebar layout ── */}
        <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
        <Route path="/host/login" element={<AppShell><HostLoginPage /></AppShell>} />
        <Route element={<RequireHostAccess />}>
          <Route element={<HostLayout />}>
            <Route path="/host/dashboard" element={<HostDashboardPage />} />
            <Route path="/host/games/:gameId" element={<GameEditorPage />} />
            <Route path="/host/sessions/:sessionId" element={<SessionPage />} />
          </Route>
        </Route>

        <Route path="*" element={<AppShell><NotFoundPage /></AppShell>} />
      </Routes>
    </HashRouter>
  )
}

export default App
