import { useMemo, useState } from 'react'
import { useFocusSession } from './useFocusSession.js'

const STATE_LABELS = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function FocusSession({ associatedTaskId }) {
  const { session, actions, PRESET_DURATIONS_MINUTES } = useFocusSession()
  const [customMinutes, setCustomMinutes] = useState('')
  const [uiError, setUiError] = useState(null)
  const [busy, setBusy] = useState(false)


  const startOptions = useMemo(() => {
    return PRESET_DURATIONS_MINUTES.slice()
  }, [PRESET_DURATIONS_MINUTES])

  const canStart = session.status === 'idle'
  const canPause = session.status === 'running'
  const canResume = session.status === 'paused'
  const canCancel = session.status === 'running' || session.status === 'paused'
  const terminal = session.status === 'completed' || session.status === 'cancelled'

  async function handleStart(durationMinutes) {
    setUiError(null)
    setBusy(true)
    try {
      await actions.start({ durationMinutes, taskId: associatedTaskId })
    } catch {
      setUiError('Unable to start your focus session.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-label="Focus session" style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Focus Session</h2>
        <div style={{ fontWeight: 800, opacity: 0.9 }}>{STATE_LABELS[session.status]}</div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 900, fontSize: 28, letterSpacing: '-0.6px' }} aria-label="Remaining time">
            {formatMMSS(session.remainingSeconds)}
          </div>
          <div style={{ color: '#444' }}>
            {session.durationMinutes ? `${session.durationMinutes} min` : '—'}
          </div>
        </div>

        {uiError ? (
          <div role="alert" style={{ color: 'crimson' }}>
            {uiError}
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {startOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleStart(m)}
              disabled={!canStart || busy}
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.1)',
                background: canStart ? '#111827' : '#9ca3af',
                color: 'white',
                cursor: canStart ? 'pointer' : 'not-allowed',
              }}
            >
              Start {m}m
            </button>
          ))}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700 }}>Custom</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              disabled={!canStart || busy}
              aria-label="Custom duration minutes"
              style={{
                width: 92,
                padding: '10px 12px',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.12)',
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              const v = Number(customMinutes)
              if (!Number.isFinite(v) || v <= 0) {
                setUiError('Please select a valid duration.')
                return
              }
              handleStart(v)
            }}
            disabled={!canStart || busy}
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.1)',
              background: canStart ? '#111827' : '#9ca3af',
              color: 'white',
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            Start
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {canPause ? (
            <button type="button" onClick={actions.pause} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' }}>
              Pause
            </button>
          ) : null}

          {canResume ? (
            <button type="button" onClick={actions.resume} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' }}>
              Resume
            </button>
          ) : null}

          {canCancel ? (
            <button
              type="button"
              onClick={async () => {
                setUiError(null)
                setBusy(true)
                try {
                  await actions.cancel()
                } catch {
                  setUiError("Session couldn't be completed.")
                } finally {
                  setBusy(false)
                }
              }}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' }}
            >
              Cancel
            </button>
          ) : null}

          {session.status === 'paused' ? null : null}

          {terminal ? (
            <button type="button" onClick={actions.reset} style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' }}>
              Start New Session
            </button>
          ) : null}

          {/* Manual Complete button intentionally omitted unless existing UI requires it. */}
        </div>
      </div>
    </section>
  )
}

