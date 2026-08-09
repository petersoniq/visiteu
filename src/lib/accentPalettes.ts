export type AccentId = 'emerald' | 'sky' | 'violet' | 'rose' | 'amber' | 'slate'

interface AccentShades {
  /** Farba pre plné pozadia (tlačidlá, bodky, aktívna záložka) - rovnaká v oboch témach */
  solid: string
  /** Hover stav plných pozadí - rovnaký v oboch témach */
  hover: string
  /** Farba pre text/ikony/odkazy na povrchu - v tmavom režime svetlejšia kvôli kontrastu */
  text: string
}

export interface AccentPalette {
  id: AccentId
  label: string
  /** Farba pre malý farebný kruh vo výbere v Profile */
  swatch: string
  light: AccentShades
  dark: AccentShades
}

export const ACCENT_PALETTES: Record<AccentId, AccentPalette> = {
  emerald: {
    id: 'emerald',
    label: 'Smaragdová',
    swatch: '#059669',
    light: { solid: '#059669', hover: '#047857', text: '#059669' },
    dark: { solid: '#059669', hover: '#047857', text: '#34d399' },
  },
  sky: {
    id: 'sky',
    label: 'Nebeská modrá',
    swatch: '#0284c7',
    light: { solid: '#0284c7', hover: '#0369a1', text: '#0284c7' },
    dark: { solid: '#0284c7', hover: '#0369a1', text: '#38bdf8' },
  },
  violet: {
    id: 'violet',
    label: 'Fialová',
    swatch: '#7c3aed',
    light: { solid: '#7c3aed', hover: '#6d28d9', text: '#7c3aed' },
    dark: { solid: '#7c3aed', hover: '#6d28d9', text: '#a78bfa' },
  },
  rose: {
    id: 'rose',
    label: 'Ružová',
    swatch: '#e11d48',
    light: { solid: '#e11d48', hover: '#be123c', text: '#e11d48' },
    dark: { solid: '#e11d48', hover: '#be123c', text: '#fb7185' },
  },
  amber: {
    id: 'amber',
    label: 'Jantárová',
    swatch: '#d97706',
    light: { solid: '#d97706', hover: '#b45309', text: '#b45309' },
    dark: { solid: '#d97706', hover: '#b45309', text: '#fbbf24' },
  },
  slate: {
    id: 'slate',
    label: 'Grafitová',
    swatch: '#334155',
    light: { solid: '#334155', hover: '#1e293b', text: '#334155' },
    dark: { solid: '#334155', hover: '#1e293b', text: '#cbd5e1' },
  },
}

export const DEFAULT_ACCENT: AccentId = 'emerald'
export const ACCENT_STORAGE_KEY = 'visiteu-accent'
