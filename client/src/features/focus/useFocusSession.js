import { useCallback, useEffect, useRef, useState } from 'react'

import { useSocket } from '../socket/useSocket.js'






import { closeSession, startSession } from './focusApi.js'
import { clearFocusSession, loadFocusSession, saveFocusSession } from './focusStorage.js'
import { computeRemainingSeconds } from './focusTimer.js'


const PRESET_DURATIONS_MINUTES = [25, 50, 90]

const initialState = {
  sessionId: null,
  taskId: null,
  blockId: null,
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


  const upsertFromServerStartedRef = useRef(null)

  const { subscribe, unsubscribe } = useSocket()

  useEffect(() => {
    // Socket synchronization: server is source of truth for endsAt/started/completed.
    // Prevent duplicate listeners by subscribing once for each handler.

    const handleStarted = (payload) => {
      if (!payload?.sessionId) return

      const endsAtMs = payload.endsAt ? Date.parse(payload.endsAt) : null
      if (!Number.isFinite(endsAtMs)) return

      const startedAtMs = payload.startedAt ? Date.parse(payload.startedAt) : null
      if (!Number.isFinite(startedAtMs)) return

      const startedKey = `${payload.sessionId}:${payload.startedAt}`
      if (upsertFromServerStartedRef.current === startedKey) return
      upsertFromServerStartedRef.current = startedKey

      const nowMs = getNowMs()
      const remainingSeconds = computeRemainingSeconds({ endsAtMs, nowMs })

      setSession((prev) => {
        if (prev.sessionId !== payload.sessionId) {
          // allow reconcile even if local state is stale
        }

        const status = 'running'
        const next = {
          ...prev,
          sessionId: payload.sessionId,
          taskId: payload.taskId ?? null,
          blockId: payload.blockId ?? null,
          durationMinutes: payload.timerMinutes ?? null,
          startsAtMs: startedAtMs,
          endsAtMs,
          remainingSeconds,
          status,
          lastUpdatedAtMs: nowMs,
        }
        saveFocusSession(next)
        return next
      })
    }

    const handleCompleted = (payload) => {
      if (!payload?.sessionId) return
      setSession((prev) => {
        if (prev.sessionId && prev.sessionId !== payload.sessionId) {
          // ignore other sessions
        }

        const nowMs = getNowMs()
        const next = {
          ...prev,
          sessionId: payload.sessionId,
          status: 'completed',
          remainingSeconds: 0,
          lastUpdatedAtMs: nowMs,
        }
        saveFocusSession(next)
        return next
      })
    }

    subscribe('focus:started', handleStarted)
    subscribe('focus:completed', handleCompleted)

    return () => {
      unsubscribe('focus:started', handleStarted)
      unsubscribe('focus:completed', handleCompleted)
    }
  }, [subscribe, unsubscribe])


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
    async ({ durationMinutes, taskId, blockId }) => {
      const duration = Number(durationMinutes)
      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('Invalid duration')
      }
      if (session.status !== 'idle') {
        throw new Error('Session already started')
      }

      const title = 'Focus Session'
      const started = await startSession({ title, timerMinutes: duration, taskId, blockId })

      const sessionId = started?.id
      if (!sessionId) {
        throw new Error('Missing session id')
      }

      const next = {
        ...buildStartState({ sessionId, taskId, durationMinutes: duration }),
        blockId: blockId ?? null,
      }
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

  }, [])


  const complete = useCallback(() => {
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

  }, [])


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
    closeSession({ sessionId: session.sessionId }).catch(() => {
      // swallow; UI state is already terminal
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

