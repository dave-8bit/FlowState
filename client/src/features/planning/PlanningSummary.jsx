import { useMemo } from 'react'

export default function PlanningSummary({ planningState, planningSchedule }) {
  const { state, statusMessage, summary } = planningState || {}

  const requiredHoursPerDay = summary?.requiredHoursPerDay
  const availableWorkingTimeMinutes = summary?.availableWorkingTimeMinutes
  const totalWorkRemainingMinutes = summary?.totalWorkRemainingMinutes
  const daysRemaining = summary?.daysRemaining

  const formatHours = (minutes) => {
    if (!Number.isFinite(minutes)) return '0'
    const hours = minutes / 60
    return String(Math.round(hours * 100) / 100)
  }

  const requiredHoursPerDayText = useMemo(() => {
    if (!Number.isFinite(requiredHoursPerDay)) return '0'
    return String(Math.round(requiredHoursPerDay * 100) / 100)
  }, [requiredHoursPerDay])

  const schedule = planningSchedule?.schedule || []
  const unscheduledTasks = planningSchedule?.unscheduledTasks || []

  return (
    <div
      aria-label="Planning summary"
      style={{
        marginTop: 12,
        textAlign: 'left',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 12,
        padding: 12,
        background: 'rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ fontWeight: 900, marginBottom: 6 }}>Planning Summary</div>

      <div style={{ display: 'grid', gap: 6, fontSize: 14, color: '#333' }}>
        <div>
          <strong>Total work remaining:</strong> {formatHours(totalWorkRemainingMinutes)} hours
        </div>
        <div>
          <strong>Available working time:</strong> {formatHours(availableWorkingTimeMinutes)} hours
        </div>
        <div>
          <strong>Days remaining:</strong> {daysRemaining ?? 0}
        </div>
        <div>
          <strong>Required hours/day:</strong> {requiredHoursPerDayText}
        </div>
        <div>
          <strong>Feasibility status:</strong> {state || ''}
        </div>
      </div>

      {statusMessage ? (
        <div
          role="status"
          style={{
            marginTop: 10,
            fontWeight: 700,
            color:
              state === 'Achievable'
                ? 'seagreen'
                : state === 'Tight'
                  ? '#b45309'
                  : state === 'At Risk'
                    ? '#b91c1c'
                    : 'crimson',
          }}
        >
          {statusMessage}
        </div>
      ) : null}

      <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
        <div style={{ fontWeight: 900 }}>Day-by-day roadmap</div>

        {schedule.length === 0 ? (
          <div style={{ color: '#666' }}>No schedule generated yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {schedule.map((day) => (
              <div
                key={day.date}
                style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 12 }}
              >
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{day.date}</div>
                <div style={{ fontSize: 14, color: '#333' }}>
                  <strong>Planned:</strong> {day.totalMinutes ? formatHours(day.totalMinutes) : '0'} hours
                </div>

                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  {(day.sessions || []).map((s, idx) => (
                    <div
                      key={`${day.date}-${s.taskId}-${idx}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title || `Task ${s.taskId || ''}`}
                        </div>
                        <div style={{ fontSize: 12, color: '#666' }}>Focus session</div>
                      </div>
                      <div style={{ fontWeight: 900 }}>{s.durationMinutes} min</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontWeight: 900, marginTop: 2 }}>Unscheduled tasks</div>
        {unscheduledTasks.length === 0 ? (
          <div style={{ color: '#666' }}>None. All tasks fit within the planned window.</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unscheduledTasks.map((id) => (
              <span key={id} style={{
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'rgba(0,0,0,0.02)',
                padding: '6px 10px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 13,
              }}>
                {id}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

