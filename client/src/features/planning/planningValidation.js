function isFutureDate(dateValue) {
  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return false
  return d.getTime() > Date.now()
}

function parsePositiveNumber(v) {
  const n = typeof v === 'string' ? Number(v) : v
  if (!Number.isFinite(n)) return null
  return n
}

export function validatePlanningSettings(settings) {
  const errors = {}

  // deadline
  if (!settings?.deadline) {
    errors.deadline = 'Please choose a future deadline.'
  } else if (!isFutureDate(settings.deadline)) {
    errors.deadline = 'Please choose a future deadline.'
  }

  // availableHoursPerDay
  const hours = parsePositiveNumber(settings?.availableHoursPerDay)
  if (hours === null || hours <= 0) {
    errors.availableHoursPerDay = 'Working hours must be greater than zero.'
  }

  // work window ordering
  const start = settings?.preferredWorkStartTime
  const end = settings?.preferredWorkEndTime
  const startOk = typeof start === 'string' && /^\d{2}:\d{2}$/.test(start)
  const endOk = typeof end === 'string' && /^\d{2}:\d{2}$/.test(end)

  if (!startOk) {
    errors.preferredWorkStartTime = 'Preferred work start time is required.'
  }
  if (!endOk) {
    errors.preferredWorkEndTime = 'Preferred work end time is required.'
  }

  if (startOk && endOk) {
    // compare lexicographically for HH:MM format
    if (end <= start) {
      errors.preferredWorkEndTime = 'End time must be after the start time.'
    }
  }

  // focus duration
  const focusMinutes = parsePositiveNumber(settings?.preferredFocusMinutes)
  if (focusMinutes === null || focusMinutes <= 0) {
    errors.preferredFocusMinutes = 'Focus duration must be greater than 0.'
  }

  // buffer days
  const bufferDays = parsePositiveNumber(settings?.bufferDaysBeforeDeadline)
  if (bufferDays === null) {
    errors.bufferDaysBeforeDeadline = 'Buffer days cannot be negative.'
  } else if (bufferDays < 0) {
    errors.bufferDaysBeforeDeadline = 'Buffer days cannot be negative.'
  }

  // working days
  const workingDays = settings?.workingDays
  const hasAny = Array.isArray(workingDays)
    ? workingDays.length > 0
    : workingDays && typeof workingDays === 'object'
      ? Object.values(workingDays).some(Boolean)
      : false
  if (!hasAny) {
    errors.workingDays = 'Please select at least one working day.'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

