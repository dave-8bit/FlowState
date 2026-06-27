function parseNumber(v) {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

function parseMinutesEstimate(task) {
  // Assumptions: backend may return one of these fields.
  // We intentionally ignore tasks without any estimated minutes.
  const candidates = [
    task?.estimatedMinutes,
    task?.estimateMinutes,
    task?.estimatedDurationMinutes,
    task?.estimatedTimeMinutes,
  ]

  for (const c of candidates) {
    const n = parseNumber(c)
    if (n !== null && n > 0) return n
  }

  // Fallback if there's a numeric estimate in a different shape
  if (task && typeof task.estimatedMinutes === 'number' && task.estimatedMinutes > 0) {
    return task.estimatedMinutes
  }

  return null
}

function isFutureDate(dateValue) {
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() > Date.now()
}

function toISODateOnly(d) {
  // local date components
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function weekdayShort(date) {
  // Mon..Sun
  const day = date.getDay() // 0 Sun .. 6 Sat
  const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return map[day]
}

function countWorkingDays({ startDate, endDateExclusive, workingDaysSet }) {
  // Counts whole calendar days where weekday is selected.
  // startDate is inclusive; endDateExclusive is exclusive.
  let count = 0
  let cur = new Date(startDate)
  while (cur < endDateExclusive) {
    const wd = weekdayShort(cur)
    if (workingDaysSet.has(wd)) count++
    cur = addDays(cur, 1)
  }
  return count
}

export function calculatePlanningFeasibility({ tasks, planningSettings }) {
  const deadline = planningSettings?.deadline

  const workingDaysArr = Array.isArray(planningSettings?.workingDays)
    ? planningSettings.workingDays
    : []
  const workingDaysSet = new Set(workingDaysArr)

  const availableHoursPerDay = parseNumber(planningSettings?.availableHoursPerDay)
  const bufferDays = parseNumber(planningSettings?.bufferDaysBeforeDeadline) ?? 0

  const focusMinutes = parseNumber(planningSettings?.preferredFocusMinutes)
  // Focus duration is not directly used yet; included for later schedule sizing.
  void focusMinutes

  // Work remaining minutes
  const workRemainingMinutes = Array.isArray(tasks)
    ? tasks
        .map((t) => parseMinutesEstimate(t))
        .filter((n) => n !== null)
        .reduce((sum, n) => sum + n, 0)
    : 0

  // If there is no deadline or no selected working days, treat as not achievable.
  if (!deadline || !isFutureDate(deadline) || workRemainingMinutes <= 0 || workingDaysSet.size === 0) {
    return {
      state: 'Not Achievable',
      statusMessage: 'Your current deadline is unlikely to be met with the available time.',
      summary: {
        totalWorkRemainingMinutes: workRemainingMinutes,
        availableWorkingTimeMinutes: 0,
        daysRemaining: 0,
        requiredHoursPerDay: 0,
      },
    }
  }

  const deadlineDate = new Date(deadline)

  // We count from tomorrow (next day) to the effective deadline - buffer.
  const now = new Date()
  const todayISO = toISODateOnly(now)
  const todayMidnight = new Date(todayISO + 'T00:00:00')
  const startDate = addDays(todayMidnight, 1)

  const effectiveDeadlineDate = addDays(deadlineDate, -Math.max(0, bufferDays))
  const endDateExclusive = addDays(effectiveDeadlineDate, 1) // include effectiveDeadline day

  const daysRemaining = countWorkingDays({
    startDate,
    endDateExclusive,
    workingDaysSet,
  })

  const perDayMinutes = (availableHoursPerDay && availableHoursPerDay > 0 ? availableHoursPerDay : 0) * 60
  const availableWorkingTimeMinutes = daysRemaining * perDayMinutes

  if (availableWorkingTimeMinutes <= 0) {
    return {
      state: 'Not Achievable',
      statusMessage: 'Your current deadline is unlikely to be met with the available time.',
      summary: {
        totalWorkRemainingMinutes: workRemainingMinutes,
        availableWorkingTimeMinutes: 0,
        daysRemaining,
        requiredHoursPerDay: 0,
      },
    }
  }

  const requiredHoursPerDay = workRemainingMinutes / 60 / daysRemaining

  const ratio = workRemainingMinutes / availableWorkingTimeMinutes

  // Deterministic thresholds:
  // Achievable: ratio <= 0.90
  // Tight: 0.90 < ratio <= 1.00
  // At Risk: 1.00 < ratio <= 1.10
  // Not Achievable: ratio > 1.10
  let state
  if (ratio <= 0.9) state = 'Achievable'
  else if (ratio <= 1.0) state = 'Tight'
  else if (ratio <= 1.1) state = 'At Risk'
  else state = 'Not Achievable'

  const statusMessage =
    state === 'Achievable'
      ? 'Your current plan is achievable.'
      : state === 'Tight'
        ? 'Your schedule is possible, but leaves little room for delays.'
        : state === 'At Risk'
          ? 'Your deadline may require longer work sessions.'
          : 'Your current deadline is unlikely to be met with the available time.'

  return {
    state,
    statusMessage,
    summary: {
      totalWorkRemainingMinutes: workRemainingMinutes,
      availableWorkingTimeMinutes,
      daysRemaining,
      requiredHoursPerDay: Number.isFinite(requiredHoursPerDay) ? requiredHoursPerDay : 0,
    },
  }
}

