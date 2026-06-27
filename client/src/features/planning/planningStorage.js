const STORAGE_KEY = 'planningSettings.v1'

function safeParse(json) {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function loadPlanningSettings() {
  if (typeof window === 'undefined') return null
  return safeParse(window.localStorage.getItem(STORAGE_KEY))
}

export function savePlanningSettings(settings) {
  if (typeof window === 'undefined') return
  if (!settings) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

