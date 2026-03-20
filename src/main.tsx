import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { GameStoreProvider } from './state/game-store'
import { SupabaseStoreProvider } from './state/supabase-store'
import { HostAccessProvider } from './state/host-access'
import { isSupabaseConfigured } from './lib/supabase'
import './index.css'

const StoreProvider = isSupabaseConfigured ? SupabaseStoreProvider : GameStoreProvider

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HostAccessProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HostAccessProvider>
  </StrictMode>,
)
