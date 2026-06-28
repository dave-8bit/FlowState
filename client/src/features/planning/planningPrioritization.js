function parseNumber(v) {
  const n = typeof v === 'string' ? Number(v) : v
  return Number.isFinite(n) ? n : null
}

function getPriorityWeight(priority) {
  switch (priority) {
    case 'CRITICAL':
      return 100000
    case 'HIGH':
      return 10000
    case 'MEDIUM':
      return 1000
    case 'LOW':
      return 100
    default:
      return 0
  }
}

function getTaskDeadlineMs(task) {
  // deadline is expected to be parseable by Date
  const deadline = task?.deadline
  if (!deadline) return null
  const ms = Date.parse(deadline)
  if (!Number.isFinite(ms)) return null
  return ms
}

function daysBetween(nowMs, targetMs) {
  if (!Number.isFinite(nowMs) || !Number.isFinite(targetMs)) return null
  return (targetMs - nowMs) / (1000 * 60 * 60 * 24)
}

function getUrgencyBoost({ overdue, deadlineDaysTo }) {
  // Overdue tasks must receive a significant urgency boost.
  if (overdue) {
    // Big boost for overdue (closer to “more overdue” -> even higher)
    const overdueDays = Math.max(0, -deadlineDaysTo)
    return 50000 + Math.round(overdueDays * 1000)
  }

  if (!Number.isFinite(deadlineDaysTo)) return 0
  // Earlier deadline => higher urgency.
  // deadlineDaysTo ~ 0 => 25000, deadlineDaysTo 30 => smaller.
  const days = Math.max(0, deadlineDaysTo)
  const urgency = 25000 / (1 + days / 7) // smooth decreasing
  return Math.round(urgency)
}

function getDurationMinutes(task) {
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

  return null
}

function getBufferUrgencyBoost({ planningSettings }) {
  const bufferDays = parseNumber(planningSettings?.bufferDaysBeforeDeadline)

  // If we can't read buffer, don't skew.
  if (bufferDays === null) return 0

  // As available buffer decreases, urgency increases.
  // Map bufferDays into a bounded multiplier.
  // bufferDays <= 0 => max boost, bufferDays >= 30 => min boost.
  const capped = Math.max(0, Math.min(30, bufferDays))
  const t = 1 - capped / 30 // 0..1 where 1 means low buffer

  // Up to +10000, scaled by urgency factors.
  return Math.round(10000 * t)
}

/**
 * Pure deterministic task prioritization.
 * Stable sort: tie score keeps original order.
 */
export function prioritizeTasks({ tasks, planningSettings }) {
  const inputTasks = Array.isArray(tasks) ? tasks : []

  const nowMs = Date.now()
  const bufferUrgencyBoost = getBufferUrgencyBoost({ planningSettings })

  const scored = inputTasks.map((task, index) => {
    const priorityWeight = getPriorityWeight(task?.priority)

    const deadlineMs = getTaskDeadlineMs(task)
    const deadlineDaysTo =
      deadlineMs !== null ? daysBetween(nowMs, deadlineMs) : null

    const overdue =
      deadlineDaysTo !== null && Number.isFinite(deadlineDaysTo) && deadlineDaysTo < 0

    const urgencyBoost = getUrgencyBoost({ overdue, deadlineDaysTo })

    // Estimated duration: when all other factors are equal, prefer shorter tasks.
    // Implement as a penalty for longer tasks.
    const durationMinutes = getDurationMinutes(task)
    const durationPenalty =
      durationMinutes === null ? 0 : Math.round(durationMinutes * 10) // longer => lower score

    // Combine into a single deterministic score.
    // Priority dominates; urgency is secondary; duration breaks remaining ties.
    const score =
      priorityWeight +
      urgencyBoost +
      bufferUrgencyBoost -
      durationPenalty

    return { task, index, score }
  })

  // Stable sort: decorate-sort-undecorate using original index as tie-breaker.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.index - b.index
  })

  return scored.map((x) => x.task)
}

