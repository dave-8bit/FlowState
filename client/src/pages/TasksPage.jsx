import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchTasks } from '../features/tasks/taskListService.js'
import { FocusSession } from '../features/focus/FocusSession.jsx'
import { useSocket } from '../features/socket/useSocket.js'
import PlanningSettings from '../features/planning/PlanningSettings.jsx'
import PlanningSummary from '../features/planning/PlanningSummary.jsx'
import { usePlanningSettings } from '../features/planning/usePlanningSettings.js'
import { calculatePlanningFeasibility } from '../features/planning/planningFeasibility.js'
import { generatePlanningSchedule } from '../features/planning/planningScheduler.js'





function priorityLabel(priority) {
  switch (priority) {
    case 'HIGH':
      return 'High'
    case 'MEDIUM':
      return 'Medium'
    case 'LOW':
      return 'Low'
    default:
      return priority || ''
  }
}

function statusLabel(status) {
  return status || ''
}

function formatDeadline(deadline) {
  if (!deadline) return ''
  const d = new Date(deadline)
  if (Number.isNaN(d.getTime())) return String(deadline)
  return d.toLocaleDateString()
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { settings: planningSettings, setField, validationErrors, reset } = usePlanningSettings()

  const socket = useSocket()

  const handleTaskCreated = useCallback(
    ({ task }) => {
      try {
        if (!task?.id) return
        setTasks((prev) => {
          const idx = prev.findIndex((t) => t.id === task.id)
          if (idx === -1) return [...prev, task]
          const next = [...prev]
          next[idx] = task
          return next
        })
      } catch (e) {
        console.error(e)
      }
    },
    [setTasks]
  )

  const handleTaskUpdated = useCallback(
    ({ task }) => {
      if (!task?.id) return
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === task.id)
        if (idx === -1) return [...prev, task]
        const next = [...prev]
        next[idx] = task
        return next
      })
    },
    [setTasks]
  )

  const handleTaskDeleted = useCallback(
    ({ taskId }) => {
      if (!taskId) return
      setTasks((prev) => prev.filter((t) => t.id !== taskId))
    },
    [setTasks]
  )

  useEffect(() => {
    if (!socket) return

    socket.subscribe('task:created', handleTaskCreated)
    socket.subscribe('task:updated', handleTaskUpdated)
    socket.subscribe('task:deleted', handleTaskDeleted)

    return () => {
      socket.unsubscribe('task:created', handleTaskCreated)
      socket.unsubscribe('task:updated', handleTaskUpdated)
      socket.unsubscribe('task:deleted', handleTaskDeleted)
    }
  }, [socket, handleTaskCreated, handleTaskUpdated, handleTaskDeleted])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const data = await fetchTasks()
        if (!cancelled) setTasks(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }

    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const cards = useMemo(() => {
    return tasks.map((t) => {
      return (
        <div key={t.id} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>{t.title || ''}</div>
          <div style={{ display: 'grid', gap: 4, fontSize: 14, color: '#333' }}>
            <div>
              <strong>Priority:</strong> {priorityLabel(t.priority)}
            </div>
            <div>
              <strong>Status:</strong> {statusLabel(t.status)}
            </div>
            <div>
              <strong>Deadline:</strong> {formatDeadline(t.deadline)}
            </div>
          </div>
        </div>
      )
    })
  }, [tasks])

  const planningFeasibility = useMemo(() => {
    return calculatePlanningFeasibility({
      tasks,
      planningSettings: planningSettings,
    })
  }, [tasks, planningSettings])

  const planningSchedule = useMemo(() => {
    return generatePlanningSchedule({
      tasks,
      planningSettings,
    })
  }, [tasks, planningSettings])

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Task Dashboard</h1>

      {loading && <div>Loading tasks…</div>}
      {error && (
        <div style={{ color: 'crimson' }}>
          Something went wrong.
        </div>
      )}

      {!loading && !error && tasks.length === 0 && <div>No tasks yet.</div>}

      {!loading && !error && tasks.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {cards}
        </div>
      )}

      {/* Focus Session foundation (timer + persistence) composed inside Tasks workflow */}
      <FocusSession />

      <PlanningSettings
        settings={planningSettings}
        setField={setField}
        validationErrors={validationErrors}
        reset={reset}
      />
      <PlanningSummary planningState={planningFeasibility} planningSchedule={planningSchedule} />
    </div>
  )
}







