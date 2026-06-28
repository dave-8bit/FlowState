import { useMemo } from 'react'

import RoadmapTimeline from './RoadmapTimeline.jsx'

export default function PlanningSummary({ planningState, planningSchedule, tasks, onStartFocus }) {
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

      <RoadmapTimeline
        planningSchedule={planningSchedule}
        tasks={tasks}
        onStartFocus={onStartFocus}
      />

    </div>

  )
}

