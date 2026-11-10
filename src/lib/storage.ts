import { DEFAULT_LAYOUT, SETTINGS_VERSION, STORAGE_KEY, type LayoutSettings } from './types'
import { mergeLayout } from './layout'

export interface PersistedState {
  version: number
  layout: LayoutSettings
}

export function loadLayout(): LayoutSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_LAYOUT }
    const parsed = JSON.parse(raw) as Partial<PersistedState> & Partial<LayoutSettings>
    if (parsed && typeof parsed === 'object' && parsed.layout) {
      return mergeLayout(parsed.layout)
    }
    return mergeLayout(parsed as Partial<LayoutSettings>)
  } catch {
    return { ...DEFAULT_LAYOUT }
  }
}

export function saveLayout(layout: LayoutSettings): void {
  const payload: PersistedState = { version: SETTINGS_VERSION, layout }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Image may be too large; persist without the background photo.
    const slim: PersistedState = {
      version: SETTINGS_VERSION,
      layout: { ...layout, backgroundDataUrl: '' },
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
    } catch {
      /* ignore quota */
    }
  }
}

export function exportSettings(layout: LayoutSettings): string {
  return JSON.stringify({ version: SETTINGS_VERSION, layout }, null, 2)
}

export function importSettings(json: string): LayoutSettings {
  const parsed = JSON.parse(json) as Partial<PersistedState> & Partial<LayoutSettings>
  if (parsed && typeof parsed === 'object' && parsed.layout) {
    return mergeLayout(parsed.layout)
  }
  return mergeLayout(parsed as Partial<LayoutSettings>)
}

export function downloadText(filename: string, text: string, mime = 'application/json'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
