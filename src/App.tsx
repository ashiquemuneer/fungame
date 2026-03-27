import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { HostLayout } from './components/HostLayout'
import { RequireHostAccess } from './components/RequireHostAccess'
import { HomePage } from './pages/HomePage'
import { HostLoginPage } from './pages/HostLoginPage'
import { HostForgotPasswordPage } from './pages/HostForgotPasswordPage'
import { HostResetPasswordPage } from './pages/HostResetPasswordPage'
import { HostSettingsPage } from './pages/HostSettingsPage'
import { HostDashboardPage } from './pages/HostDashboardPage'
import { HostMyGamesPage } from './pages/HostMyGamesPage'
import { HostSessionsPage } from './pages/HostSessionsPage'
import { GameEditorPage } from './pages/GameEditorPage'
import { SessionPage } from './pages/SessionPage'
import { JoinPage } from './pages/JoinPage'
import { PlayPage } from './pages/PlayPage'
import { ResultsPage } from './pages/ResultsPage'
import { PublicGamePage } from './pages/PublicGamePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DesignSystemPage } from './pages/DesignSystemPage'

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* ── Public / player routes ── */}
        <Route path="/" element={<AppShell><HomePage /></AppShell>} />
        <Route path="/join" element={<AppShell><JoinPage /></AppShell>} />
        <Route path="/play/:sessionId" element={<AppShell><PlayPage /></AppShell>} />
        <Route path="/results/:sessionId" element={<AppShell><ResultsPage /></AppShell>} />
        <Route path="/share/:gameId" element={<AppShell><PublicGamePage /></AppShell>} />

        {/* ── Host auth routes ── */}
        <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
        <Route path="/host/login" element={<AppShell><HostLoginPage /></AppShell>} />
        <Route path="/host/forgot-password" element={<AppShell><HostForgotPasswordPage /></AppShell>} />
        <Route path="/host/reset-password" element={<AppShell><HostResetPasswordPage /></AppShell>} />

        {/* ── Protected host routes (sidebar layout) ── */}
        <Route element={<RequireHostAccess />}>
          <Route element={<HostLayout />}>
            <Route path="/host/dashboard"           element={<HostDashboardPage />} />
            <Route path="/host/my-games"            element={<HostMyGamesPage />} />
            <Route path="/host/sessions"            element={<HostSessionsPage />} />
            <Route path="/host/sessions/:sessionId" element={<SessionPage />} />
            <Route path="/host/settings"            element={<HostSettingsPage />} />
          </Route>
          {/* Fullscreen editor — no sidebar */}
          <Route path="/host/games/:gameId" element={<GameEditorPage />} />
        </Route>

        {/* ── Design System (dev only) ── */}
        <Route path="/ds" element={<DesignSystemPage />} />

        <Route path="*" element={<AppShell><NotFoundPage /></AppShell>} />
      </Routes>
    </HashRouter>
  )
}

export default App
