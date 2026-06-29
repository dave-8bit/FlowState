function pad2(n) {
  return String(n).padStart(2, '0')
}

function toISODateOnly(d) {
  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  return `${y}-${m}-${day}`
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function weekdayShort(date) {
  const day = date.getDay() // 0 Sun .. 6 Sat
  const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return map[day]
}

function parseNumber(v) {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

function parseMinutesEstimate(task) {
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

  if (task && typeof task.estimatedMinutes === 'number' && task.estimatedMinutes > 0) {
    return task.estimatedMinutes
  }

  return null
}

function parseTimeHHMM(value) {
  if (typeof value !== 'string') return null
  const m = value.match(/^(\d{2}):(\d{2})$/)
  if (!m) return null
  const hh = Number(m[1])
  const mm = Number(m[2])
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null
  if (hh < 0 || hh > 23) return null
  if (mm < 0 || mm > 59) return null
  return { hh, mm }
}

// intentionally no time-of-day math in the pure scheduler (capacity is controlled by availableHoursPerDay)




// Deterministic block identity is generated once blocks are assigned to a specific
// scheduled day/date (see insertion into schedule[].sessions). No placeholder values.


function splitTaskIntoFocusBlocks({ taskId, title, durationMinutes, focusMinutes }) {
  const sessions = []
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return sessions

  let remaining = durationMinutes
  let blockIndexWithinTask = 0
  while (remaining > 0) {
    const block = Math.min(focusMinutes, remaining)

    sessions.push({
      // blockId is intentionally NOT generated here because we don't yet know the final scheduled day.
      taskId,
      title,
      blockIndexWithinTask,
      durationMinutes: block,
    })

    remaining -= block
    blockIndexWithinTask += 1
  }
  return sessions
}



export function generatePlanningSchedule({ tasks, planningSettings }) {
  const planningDaysArr = Array.isArray(planningSettings?.workingDays)
    ? planningSettings.workingDays
    : []
  const workingDaysSet = new Set(planningDaysArr)

  const deadlineValue = planningSettings?.deadline
  const deadlineDate = deadlineValue ? new Date(deadlineValue) : null

  const bufferDays = parseNumber(planningSettings?.bufferDaysBeforeDeadline)
  const bufferDaysSafe = bufferDays === null ? 0 : Math.max(0, bufferDays)

  const availableHoursPerDay = parseNumber(planningSettings?.availableHoursPerDay)
  const availableMinutesPerDay =
    availableHoursPerDay !== null && availableHoursPerDay > 0 ? availableHoursPerDay * 60 : 0

  const focusMinutes = parseNumber(planningSettings?.preferredFocusMinutes)
  const focusMinutesSafe = focusMinutes !== null && focusMinutes > 0 ? Math.floor(focusMinutes) : 0

  // preferred work start/end influences ordering/time-of-day, but capacity is primarily controlled by availableHoursPerDay.
  // To keep scheduler deterministic and aligned with existing feasibility settings, we enforce:
  // - daily capacity via availableHoursPerDay
  // - no scheduling outside selected focus blocks
  const startTime = parseTimeHHMM(planningSettings?.preferredWorkStartTime)
  const endTime = parseTimeHHMM(planningSettings?.preferredWorkEndTime)
  void startTime
  void endTime

  // Scheduler rule: schedule forward from today (starting tomorrow), stop at deadline minus buffer.
  // Effective cutoff is inclusive: last day that can contain work.
  const now = new Date()
  const todayISO = toISODateOnly(now)
  const todayMidnight = new Date(`${todayISO}T00:00:00`)
  const startDate = addDays(todayMidnight, 1) // tomorrow

  const scheduledUntilDate = deadlineDate
    ? addDays(deadlineDate, -Math.max(0, bufferDaysSafe))
    : null

  if (
    !deadlineDate ||
    !Number.isFinite(deadlineDate.getTime()) ||
    workingDaysSet.size === 0 ||
    availableMinutesPerDay <= 0 ||
    focusMinutesSafe <= 0 ||
    !scheduledUntilDate ||
    scheduledUntilDate < startDate
  ) {
    return {
      schedule: [],
      unscheduledTasks: Array.isArray(tasks) ? tasks.map((t) => t?.id).filter(Boolean) : [],
      status: 'not-achievable',
    }
  }

  const schedule = []
  const unscheduledTasks = []

  // Preserve existing task order.
  const normalizedTasks = Array.isArray(tasks) ? tasks : []

  // For each day, we place blocks until the day's capacity is full.
  // Task splitting into focus blocks occurs in deterministic order (within a task, then across days).
  let taskIdx = 0
  let currentTaskSessions = []

  // Helper to advance to next task with a valid duration estimate.
  function advanceToNextTask() {
    currentTaskSessions = []

    while (taskIdx < normalizedTasks.length) {
      const task = normalizedTasks[taskIdx]
      const durationMinutes = parseMinutesEstimate(task)
      if (!durationMinutes || durationMinutes <= 0) {
        unscheduledTasks.push(task?.id)
        taskIdx += 1
        continue
      }

      const title = task?.title || ''
      // Split into focus blocks deterministically.
      // Phase 1: do NOT generate blockId yet (day/date is not known).
      currentTaskSessions = splitTaskIntoFocusBlocks({
        taskId: task?.id,
        title,
        durationMinutes,
        focusMinutes: focusMinutesSafe,
      })





      return
    }

    currentTaskSessions = []
  }

  advanceToNextTask()

  const dayCursor = new Date(startDate)
  // inclusive loop up to scheduledUntilDate
  while (dayCursor <= scheduledUntilDate) {
    const wd = weekdayShort(dayCursor)

    if (!workingDaysSet.has(wd)) {
      dayCursor.setDate(dayCursor.getDate() + 1)
      continue
    }

    let remainingCapacity = availableMinutesPerDay
    const sessionsForDay = []

    // Fill day with focus blocks from the current task, then advance tasks.
    while (remainingCapacity > 0) {
      if (currentTaskSessions.length === 0) {
        if (taskIdx >= normalizedTasks.length) break
        advanceToNextTask()
        if (!currentTaskSessions.length) break
      }

      if (currentTaskSessions.length === 0) break

      const nextSession = currentTaskSessions[0]
      const blockMinutes = nextSession?.durationMinutes

      if (!Number.isFinite(blockMinutes) || blockMinutes <= 0) {
        // Defensive: drop invalid blocks.
        currentTaskSessions.shift()
        continue
      }

      if (blockMinutes <= remainingCapacity) {
        // Phase 2 (final): we now know the real scheduled day/date, so generate blockId here.
        const scheduledDate = toISODateOnly(dayCursor)
        const blockId = `${nextSession.taskId}::${scheduledDate}::${nextSession.blockIndexWithinTask}::${nextSession.durationMinutes}`
        sessionsForDay.push({ ...nextSession, blockId })
        remainingCapacity -= blockMinutes
        currentTaskSessions.shift()


        // If we finished the current task, advance to next one.
        if (currentTaskSessions.length === 0) {
          taskIdx += 1
          advanceToNextTask()
        }
      } else {
        // Can't fit this focus block today; try later days.
        break
      }
    }

    if (sessionsForDay.length > 0) {
      schedule.push({
        date: toISODateOnly(dayCursor),
        totalMinutes: availableMinutesPerDay - remainingCapacity,
        sessions: sessionsForDay,
      })
    }

    // If everything is scheduled, exit.
    if (taskIdx >= normalizedTasks.length && currentTaskSessions.length === 0) break

    dayCursor.setDate(dayCursor.getDate() + 1)
  }

  // Any remaining blocks correspond to unscheduled tasks.
  // To preserve deterministic behavior, add unscheduled task IDs in task order.
  const remainingTaskIds = []
  // current task (taskIdx) might be partially scheduled.
  if (taskIdx < normalizedTasks.length) {
    const cur = normalizedTasks[taskIdx]
    if (cur?.id && currentTaskSessions.length > 0) remainingTaskIds.push(cur.id)
  }
  // all tasks after taskIdx are unscheduled
  for (let i = taskIdx + 1; i < normalizedTasks.length; i += 1) {
    const t = normalizedTasks[i]
    if (t?.id) remainingTaskIds.push(t.id)
  }

  // Merge unscheduledTasks from invalid/missing durations with remaining unscheduled.
  for (const id of remainingTaskIds) {
    if (id && !unscheduledTasks.includes(id)) unscheduledTasks.push(id)
  }

  const status = unscheduledTasks.length === 0 ? 'achievable' : 'not-achievable'

  return {
    schedule,
    unscheduledTasks,
    status,
  }
}

