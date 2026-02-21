const STORAGE_KEY = 'nosavesies_confirmed'

function getStoredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function setStoredIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

export function hasConfirmed(reportId: string): boolean {
  return getStoredIds().has(reportId)
}

export function markConfirmed(reportId: string): void {
  const ids = getStoredIds()
  ids.add(reportId)
  setStoredIds(ids)
}
