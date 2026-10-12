import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'golfc-theme'
const media =
  typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null

function readStored(): Theme {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* sin storage */
  }
  return 'system'
}

let theme: Theme = readStored()
const listeners = new Set<() => void>()

function systemPrefersDark(): boolean {
  return media?.matches ?? false
}

function resolveTheme(): 'light' | 'dark' {
  return theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme
}

function applyTheme(): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolveTheme() === 'dark')
}

function emit(): void {
  for (const listener of listeners) listener()
}

export function setTheme(next: Theme): void {
  theme = next
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* sin storage */
  }
  applyTheme()
  emit()
}

export function toggleTheme(): void {
  setTheme(resolveTheme() === 'dark' ? 'light' : 'dark')
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

if (media) {
  media.addEventListener('change', () => {
    if (theme === 'system') {
      applyTheme()
      emit()
    }
  })
}

// Aplica el tema al cargar el módulo. El script inline en index.html ya evitó
// el destello (FOUC); esto mantiene el store y el DOM sincronizados.
applyTheme()

function getTheme(): Theme {
  return theme
}

function getResolved(): 'light' | 'dark' {
  return resolveTheme()
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, getTheme, getTheme)
  const resolved = useSyncExternalStore(subscribe, getResolved, getResolved)
  return { theme: current, resolvedTheme: resolved, setTheme, toggleTheme }
}

/** Color de la status bar (Android/PWA) según el tema resuelto. */
export const THEME_META_COLORS = {
  light: '#ffffff',
  dark: '#0e1a14',
} as const
