export function clampRemainingSeconds(seconds) {
  if (!Number.isFinite(seconds)) return 0
  return Math.max(0, Math.floor(seconds))
}

export function computeRemainingMs({ endsAtMs, nowMs }) {
  const remaining = endsAtMs - nowMs
  return Math.max(0, remaining)
}

export function computeRemainingSeconds({ endsAtMs, nowMs }) {
  const remainingMs = computeRemainingMs({ endsAtMs, nowMs })
  return Math.ceil(remainingMs / 1000)
}

export function secondsToMinutes(seconds) {
  if (!Number.isFinite(seconds)) return 0
  return Math.round(seconds / 60)
}

