import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ACCENT_PALETTES, DEFAULT_ACCENT, ACCENT_STORAGE_KEY, type AccentId } from '../lib/accentPalettes'
import { useTheme } from './ThemeContext'

interface AccentContextValue {
  accent: AccentId
  setAccent: (accent: AccentId) => void
}

const AccentContext = createContext<AccentContextValue | undefined>(undefined)

function getInitialAccent(): AccentId {
  if (typeof window === 'undefined') return DEFAULT_ACCENT
  const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY)
  if (stored && stored in ACCENT_PALETTES) return stored as AccentId
  return DEFAULT_ACCENT
}

export function AccentProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  const [accent, setAccentState] = useState<AccentId>(getInitialAccent)

  useEffect(() => {
    const palette = ACCENT_PALETTES[accent]
    const shades = theme === 'dark' ? palette.dark : palette.light
    const root = document.documentElement
    root.style.setProperty('--color-accent', shades.solid)
    root.style.setProperty('--color-accent-hover', shades.hover)
    root.style.setProperty('--color-accent-text', shades.text)

    // Zladenie farby PWA/prehliadačového UI (stavový riadok pri inštalovanej appke) s akcentom
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', shades.solid)

    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent)
  }, [accent, theme])

  function setAccent(next: AccentId) {
    setAccentState(next)
  }

  return <AccentContext.Provider value={{ accent, setAccent }}>{children}</AccentContext.Provider>
}

export function useAccent() {
  const ctx = useContext(AccentContext)
  if (!ctx) throw new Error('useAccent musí byť použitý vnútri AccentProvider')
  return ctx
}
