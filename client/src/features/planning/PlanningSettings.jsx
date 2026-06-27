import { useMemo } from 'react'

import { usePlanningSettings } from './usePlanningSettings.js'


const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']



function ToggleDay({ day, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(day, e.target.checked)} />
      <span style={{ fontWeight: 700 }}>{day}</span>
    </label>
  )
}

export default function PlanningSettings() {
  const { settings, setField, validationErrors, reset } = usePlanningSettings()





  const selectedDays = useMemo(() => {
    const v = settings.workingDays
    return Array.isArray(v) ? v : []
  }, [settings.workingDays])

  const updateWorkingDays = (day, checked) => {
    setField('workingDays', (prev) => {
      const list = Array.isArray(prev) ? prev.slice() : []
      const has = list.includes(day)
      if (checked && !has) return [...list, day]
      if (!checked && has) return list.filter((d) => d !== day)
      return list
    })
  }

  return (
    <section aria-label="Planning settings" style={{ marginTop: 18, textAlign: 'left' }}>
      <h2 style={{ margin: 0, marginBottom: 10 }}>Planning Settings</h2>

      <form>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="planning-deadline" style={{ fontWeight: 800 }}>
              Deadline
            </label>
            <input
              id="planning-deadline"
              type="date"
              value={settings.deadline}
              onChange={(e) => setField('deadline', e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)' }}
            />
            {validationErrors.deadline ? (
              <div role="alert" style={{ color: 'crimson', fontSize: 14 }}>
                {validationErrors.deadline}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="planning-hours" style={{ fontWeight: 800 }}>
              Available hours per day
            </label>
            <input
              id="planning-hours"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.25}
              value={settings.availableHoursPerDay}
              onChange={(e) => setField('availableHoursPerDay', e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)' }}
            />
            {validationErrors.availableHoursPerDay ? (
              <div role="alert" style={{ color: 'crimson', fontSize: 14 }}>
                {validationErrors.availableHoursPerDay}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="planning-start" style={{ fontWeight: 800 }}>
                  Preferred work start time
                </label>
                <input
                  id="planning-start"
                  type="time"
                  value={settings.preferredWorkStartTime}
                  onChange={(e) => setField('preferredWorkStartTime', e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)' }}
                />
                {validationErrors.preferredWorkStartTime ? (
                  <div role="alert" style={{ color: 'crimson', fontSize: 14 }}>
                    {validationErrors.preferredWorkStartTime}
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                <label htmlFor="planning-end" style={{ fontWeight: 800 }}>
                  Preferred work end time
                </label>
                <input
                  id="planning-end"
                  type="time"
                  value={settings.preferredWorkEndTime}
                  onChange={(e) => setField('preferredWorkEndTime', e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)' }}
                />
                {validationErrors.preferredWorkEndTime ? (
                  <div role="alert" style={{ color: 'crimson', fontSize: 14 }}>
                    {validationErrors.preferredWorkEndTime}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="planning-focus" style={{ fontWeight: 800 }}>
              Preferred focus session duration (minutes)
            </label>
            <input
              id="planning-focus"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={settings.preferredFocusMinutes}
              onChange={(e) => setField('preferredFocusMinutes', e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)' }}
            />
            {validationErrors.preferredFocusMinutes ? (
              <div role="alert" style={{ color: 'crimson', fontSize: 14 }}>
                {validationErrors.preferredFocusMinutes}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Working days (Mon–Sun)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {DAYS.map((d) => (
                <ToggleDay
                  key={d}
                  day={d}
                  checked={selectedDays.includes(d)}
                  onChange={updateWorkingDays}
                />
              ))}
            </div>
            {validationErrors.workingDays ? (
              <div role="alert" style={{ color: 'crimson', fontSize: 14 }}>
                {validationErrors.workingDays}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label htmlFor="planning-buffer" style={{ fontWeight: 800 }}>
              Optional buffer days before deadline
            </label>
            <input
              id="planning-buffer"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={settings.bufferDaysBeforeDeadline}
              onChange={(e) => setField('bufferDaysBeforeDeadline', e.target.value)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)' }}
            />
            {validationErrors.bufferDaysBeforeDeadline ? (
              <div role="alert" style={{ color: 'crimson', fontSize: 14 }}>
                {validationErrors.bufferDaysBeforeDeadline}
              </div>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={reset}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: '#f3f4f6' }}
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </section>
  )
}

