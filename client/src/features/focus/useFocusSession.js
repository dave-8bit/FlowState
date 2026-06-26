import { useCallback, useEffect, useRef, useState } from 'react'


import { closeSession, startSession } from './focusApi.js'
import { clearFocusSession, loadFocusSession, saveFocusSession } from './focusStorage.js'
import { computeRemainingSeconds } from './focusTimer.js'

const PRESET_DURATIONS_MINUTES = [25, 50, 90]

const initialState = {
  sessionId: null,
  taskId: null,
  durationMinutes: null,
  startsAtMs: null,
  endsAtMs: null,
  remainingSeconds: 0,
  status: 'idle', // idle | running | paused | completed | cancelled
  lastUpdatedAtMs: null,
}

const transitionRules = {
  idle: new Set(['running', 'cancelled']),
  running: new Set(['paused', 'completed', 'cancelled']),
  paused: new Set(['running', 'completed', 'cancelled']),
  completed: new Set(),
  cancelled: new Set(),
}

function canTransition(from, to) {
  return transitionRules[from]?.has(to) ?? false
}

function getNowMs() {
  return Date.now()
}

function buildStartState({ sessionId, taskId, durationMinutes }) {
  const nowMs = getNowMs()
  const durationMs = durationMinutes * 60 * 1000
  return {
    sessionId,
    taskId: taskId ?? null,
    durationMinutes,
    startsAtMs: nowMs,
    endsAtMs: nowMs + durationMs,
    remainingSeconds: Math.ceil(durationMs / 1000),
    status: 'running',
    lastUpdatedAtMs: nowMs,
  }
}

function rehydrateState(stored) {
  if (!stored || typeof stored !== 'object') return initialState

  const status = stored.status || 'idle'
  const endsAtMs = typeof stored.endsAtMs === 'number' ? stored.endsAtMs : null

  let remainingSeconds = 0
  if (status === 'running' && endsAtMs) {
    remainingSeconds = computeRemainingSeconds({ endsAtMs, nowMs: getNowMs() })
  } else if (typeof stored.remainingSeconds === 'number') {
    remainingSeconds = stored.remainingSeconds
  }

  return {
    ...initialState,
    ...stored,
    status,
    remainingSeconds,
    lastUpdatedAtMs: getNowMs(),
  }
}

export function useFocusSession() {
  const [session, setSession] = useState(() => {
    const stored = loadFocusSession()
    return stored ? rehydrateState(stored) : initialState
  })

  const intervalRef = useRef(null)


  const persist = useCallback((next) => {
    setSession(next)
    saveFocusSession(next)
  }, [])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    // keep persistence fresh if running/paused/completed/cancelled
    // but avoid excessive writes per tick: remainingSeconds is updated frequently.
  }, [])

  useEffect(() => {
    stopInterval()

    if (session.status === 'running' && typeof session.endsAtMs === 'number') {
      intervalRef.current = setInterval(() => {
        const nowMs = getNowMs()
        const remainingSeconds = computeRemainingSeconds({ endsAtMs: session.endsAtMs, nowMs })

        setSession((prev) => {
          const shouldComplete = prev.status === 'running' && remainingSeconds <= 0

          if (shouldComplete) {
            const next = {
              ...prev,
              remainingSeconds: 0,
              status: 'completed',
              lastUpdatedAtMs: nowMs,
            }
            saveFocusSession(next)
            return next
          }

          const next = {
            ...prev,
            remainingSeconds,
            lastUpdatedAtMs: nowMs,
          }
          // Reduce write frequency: still ok to persist on tick due to small state.
          // If needed later, we can debounce.
          saveFocusSession(next)
          return next
        })
      }, 1000)
    }

    return () => {
      stopInterval()
    }
  }, [session.status, session.endsAtMs, stopInterval])

  // Persist a stable derived state on terminal states
  useEffect(() => {
    if (session.status === 'completed' || session.status === 'cancelled') {
      saveFocusSession(session)
      stopInterval()
    }
  }, [session.status, session, stopInterval])

  const start = useCallback(
    async ({ durationMinutes, taskId }) => {
      const duration = Number(durationMinutes)
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('Invalid duration')
      }
      if (session.status !== 'idle') {
        throw new Error('Session already started')
      }

      const title = 'Focus Session'
      const started = await startSession({ title, timerMinutes: duration, taskId })

      const sessionId = started?.id
      if (!sessionId) {
        throw new Error('Missing session id')
      }

      const next = buildStartState({ sessionId, taskId, durationMinutes: duration })
      persist(next)
      return next
    },
    [persist, session.status]
  )

  const pause = useCallback(() => {
    setSession((prev) => {
      if (!canTransition(prev.status, 'paused')) return prev
      if (prev.status !== 'running') return prev

      const nowMs = getNowMs()
      const endsAtMs = typeof prev.endsAtMs === 'number' ? prev.endsAtMs : null
      if (!endsAtMs) return prev

      const remainingSeconds = computeRemainingSeconds({ endsAtMs, nowMs })
      const next = {
        ...prev,
        status: 'paused',
        remainingSeconds,
        lastUpdatedAtMs: nowMs,
      }
      saveFocusSession(next)
      return next
    })
  }, [])

  const resume = useCallback(() => {
    setSession((prev) => {
      if (!canTransition(prev.status, 'running')) return prev
      if (prev.status !== 'paused') return prev

      const nowMs = getNowMs()
      const durationMinutes = prev.durationMinutes
      const remainingSeconds = prev.remainingSeconds

      const remainingMs = remainingSeconds * 1000
      const endsAtMs = nowMs + remainingMs

      const next = {
        ...prev,
        status: 'running',
        startsAtMs: prev.startsAtMs ?? nowMs,
        endsAtMs,
        lastUpdatedAtMs: nowMs,
      }
      saveFocusSession(next)
      return next
    })
  }, [])

  const cancel = useCallback(async () => {
    setSession((prev) => {
      if (!canTransition(prev.status, 'cancelled')) return prev
      const nowMs = getNowMs()
      const next = {
        ...prev,
        status: 'cancelled',
        remainingSeconds: 0,
        lastUpdatedAtMs: nowMs,
      }
      saveFocusSession(next)
      return next
    })

    if (session.sessionId) {
      await closeSession({ sessionId: session.sessionId })
    }
  }, [session.sessionId])

  const complete = useCallback(async () => {
    setSession((prev) => {
      if (!canTransition(prev.status, 'completed')) return prev
      const nowMs = getNowMs()
      const next = {
        ...prev,
        status: 'completed',
        remainingSeconds: 0,
        lastUpdatedAtMs: nowMs,
      }
      saveFocusSession(next)
      return next
    })

    if (session.sessionId) {
      await closeSession({ sessionId: session.sessionId })
    }
  }, [session.sessionId])

  // When we auto-complete (timer reaches 0), call backend close exactly once.
  const lastTerminalRef = useRef(null)
  useEffect(() => {
    const terminal = session.status === 'completed' || session.status === 'cancelled'
    if (!terminal) return

    if (!session.sessionId) return

    const key = `${session.sessionId}:${session.status}`
    if (lastTerminalRef.current === key) return
    lastTerminalRef.current = key

    // fire-and-forget with dev logging; UI handles already terminal state.
    closeSession({ sessionId: session.sessionId }).catch((e) => {
      // eslint-disable-next-line no-console
      console.error('Focus session close failed', e)
    })
  }, [session.sessionId, session.status])

  const reset = useCallback(() => {
    lastTerminalRef.current = null
    stopInterval()
    clearFocusSession()
    setSession(initialState)
  }, [stopInterval])

  return {
    PRESET_DURATIONS_MINUTES,
    session,

    actions: {
      start,
      pause,
      resume,
      cancel,
      complete,
      reset,
    },
  }
}

