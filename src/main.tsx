import { Component, StrictMode, type PropsWithChildren, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GameStoreProvider } from './state/game-store'
import { SupabaseStoreProvider } from './state/supabase-store'
import { HostAccessProvider } from './state/host-access'
import { ToastProvider } from './components/ui'
import { isSupabaseConfigured } from './lib/supabase'
import './index.css'

const StoreProvider = isSupabaseConfigured ? SupabaseStoreProvider : GameStoreProvider

class ErrorBoundary extends Component<PropsWithChildren, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-white">
          <p className="text-lg font-semibold">Something went wrong</p>
          <p className="text-sm text-white/60">
            Try refreshing the page. If this keeps happening, open in an incognito window.
          </p>
          <button
            className="rounded-full bg-white/10 px-5 py-2 text-sm hover:bg-white/20"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HostAccessProvider>
        <StoreProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </StoreProvider>
      </HostAccessProvider>
    </ErrorBoundary>
  </StrictMode>,
)
