const STORAGE_KEY = 'nosavesies_resolved'

function getStoredIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set((parsed as unknown[]).filter((id): id is string => typeof id === 'string'))
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

export function hasResolved(reportId: string): boolean {
  if (typeof reportId !== 'string' || reportId.length === 0) return false
  const ids = getStoredIds()
  return ids.has(reportId)
}

export function markResolved(reportId: string): void {
  const ids = getStoredIds()
  ids.add(reportId)
  setStoredIds(ids)
}
