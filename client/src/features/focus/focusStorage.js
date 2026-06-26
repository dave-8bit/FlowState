const STORAGE_KEY = 'focusSession.v1'

function safeParse(json) {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function loadFocusSession() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

export function saveFocusSession(state) {
  if (typeof window === 'undefined') return
  if (!state) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearFocusSession() {
  saveFocusSession(null)
}

