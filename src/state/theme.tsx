import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'

type Theme = 'dark' | 'light' | 'system'

const ThemeContext = createContext<{
  theme: Theme
  setTheme: (t: Theme) => void
}>({ theme: 'system', setTheme: () => {} })

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('fg-theme') as Theme) ?? 'system'
  })

  useEffect(() => {
    const applyTheme = () => {
      let isLight = theme === 'light'
      if (theme === 'system') {
        isLight = !window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      
      if (isLight) {
        document.documentElement.classList.add('light')
      } else {
        document.documentElement.classList.remove('light')
      }
    }

    applyTheme()
    
    // Subscribe to system changes if we are in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      if (theme === 'system') applyTheme()
    }
    mediaQuery.addEventListener('change', listener)
    
    localStorage.setItem('fg-theme', theme)
    
    return () => mediaQuery.removeEventListener('change', listener)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
