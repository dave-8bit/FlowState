export default function RoadmapTimeline({
  planningSchedule,
  tasks,
  onStartFocus,
  progress,
}) {
  const schedule = planningSchedule?.schedule || []
  const unscheduledTaskIds = planningSchedule?.unscheduledTasks || []



  const tasksById = (Array.isArray(tasks) ? tasks : []).reduce((acc, t) => {
    if (t?.id) acc[t.id] = t
    return acc
  }, {})

  const pad2 = (n) => String(n).padStart(2, '0')
  const formatDateFromISO = (isoDateOnly) => {
    // isoDateOnly is expected to be YYYY-MM-DD
    const d = new Date(`${isoDateOnly}T00:00:00`)
    if (Number.isNaN(d.getTime())) return isoDateOnly

    const weekday = d.toLocaleDateString(undefined, { weekday: 'long' })
    const day = pad2(d.getDate())
    const month = pad2(d.getMonth() + 1)
    const year = d.getFullYear()
    return `${weekday} • ${day} / ${month} / ${year}`
  }

  const minutesToHoursMinutes = (minutes) => {
    if (!Number.isFinite(minutes) || minutes <= 0) return '0m'
    const total = Math.round(minutes)
    const h = Math.floor(total / 60)
    const m = total % 60
    if (h <= 0) return `${m}m`
    if (m <= 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const minutesToHoursText = (minutes) => {
    if (!Number.isFinite(minutes)) return '0'
    const hours = minutes / 60
    return String(Math.round(hours * 100) / 100)
  }

  const completedCount = progress?.completedBlocksCount ?? 0
  const remainingCount = progress?.remainingBlocksCount ?? 0
  const percentComplete = progress?.percentComplete ?? 0

  const completionPillColor = percentComplete >= 100 ? 'seagreen' : '#111827'

  const completionPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 10px',
    borderRadius: 999,
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'rgba(0,0,0,0.02)',
    color: completionPillColor,
    fontWeight: 900,
    fontSize: 13,
  }


  const focusBlocksByDay = (day) => {
    const sessions = day?.sessions || []
    // sessions are expected to be in already-determined order
    return sessions.map((s, idx) => ({ ...s, order: idx + 1 }))
  }

  return (
    <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontWeight: 900 }}>Day-by-day roadmap</div>
        <div style={completionPillStyle}>
          {completedCount} completed • {remainingCount} remaining • {Math.max(0, Math.min(100, Math.round(percentComplete)))}%
        </div>
      </div>


      {schedule.length === 0 ? (
        <div style={{ color: '#666' }}>No schedule generated yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {schedule.map((day) => {
            const sessions = focusBlocksByDay(day)
            const totalMinutes = day?.totalMinutes || 0

            return (
              <div
                key={day.date}
                style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 12 }}
              >
                <div style={{ fontWeight: 900, marginBottom: 6 }}>{formatDateFromISO(day.date)}</div>

                <div style={{ fontSize: 14, color: '#333' }}>
                  <div>
                    <strong>Total Planned:</strong> {minutesToHoursMinutes(totalMinutes)}
                  </div>
                  <div style={{ color: '#555', marginTop: 4 }}>
                    <strong>Planned:</strong> {minutesToHoursText(totalMinutes)} hours
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                  {sessions.map((s) => {
                    const title =
                      s.title || tasksById?.[s.taskId]?.title || 'Untitled Task'
                    return (

                      <div
                        key={`${day.date}-${s.taskId}-${s.order}`}
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
                          <div
                            style={{
                              fontWeight: 800,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {title}
                          </div>
                          <div style={{ fontSize: 12, color: '#666' }}>
                            Session {s.order}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <div style={{ fontWeight: 900 }}>{s.durationMinutes} min</div>
                          <button
                            type="button"
                            onClick={() => onStartFocus?.(s.taskId, s.blockId, s.durationMinutes)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 12,
                              border: '1px solid rgba(0,0,0,0.1)',
                              background: '#111827',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 800,
                            }}
                          >
                            Start Focus
                          </button>
                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {Array.isArray(unscheduledTaskIds) && unscheduledTaskIds.length > 0 ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 900 }}>Unscheduled Tasks</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {unscheduledTaskIds.map((taskId) => {
              const t = tasksById?.[taskId]
              const remainingMinutes =
                // scheduler only provides ids for unscheduled tasks; derive remaining duration from task estimate if present
                t?.estimatedMinutes ?? t?.estimateMinutes ?? t?.estimatedDurationMinutes ?? t?.estimatedTimeMinutes

              return (
                <div
                  key={taskId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: 'rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t?.title || tasksById?.[taskId]?.title || 'Untitled Task'}

                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>Task</div>
                  </div>
                  <div style={{ fontWeight: 900 }}>{Number.isFinite(Number(remainingMinutes)) ? remainingMinutes : ''} min</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

