/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

const STORAGE_KEY = 'fungame-host-access'
const DEFAULT_HOST_CODE = 'host123'

interface HostAccessContextValue {
  isUnlocked: boolean
  login: (code: string) => boolean
  logout: () => void
}

const HostAccessContext = createContext<HostAccessContextValue | null>(null)

function getExpectedCode() {
  return import.meta.env.VITE_HOST_ACCESS_CODE?.trim() || DEFAULT_HOST_CODE
}

function getInitialUnlockedState() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.sessionStorage.getItem(STORAGE_KEY) === 'granted'
}

export function HostAccessProvider({ children }: PropsWithChildren) {
  const [isUnlocked, setIsUnlocked] = useState(getInitialUnlockedState)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (isUnlocked) {
      window.sessionStorage.setItem(STORAGE_KEY, 'granted')
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [isUnlocked])

  const value = useMemo<HostAccessContextValue>(
    () => ({
      isUnlocked,
      login: (code: string) => {
        const matches = code.trim() === getExpectedCode()
        setIsUnlocked(matches)
        return matches
      },
      logout: () => setIsUnlocked(false),
    }),
    [isUnlocked],
  )

  return (
    <HostAccessContext.Provider value={value}>{children}</HostAccessContext.Provider>
  )
}

export function useHostAccess() {
  const context = useContext(HostAccessContext)

  if (!context) {
    throw new Error('useHostAccess must be used within HostAccessProvider')
  }

  return context
}
