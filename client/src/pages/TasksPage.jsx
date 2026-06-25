import { useEffect, useMemo, useState } from 'react'
import { fetchTasks } from '../features/tasks/taskListService.js'

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

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginTop: 0 }}>Task Dashboard</h1>

      {loading && <div>Loading tasks…</div>}
      {error && (
        <div style={{ color: 'crimson' }}>
          Error loading tasks: {error?.message || String(error)}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && <div>No tasks yet.</div>}

      {!loading && !error && tasks.length > 0 && (
        <div style={{ display: 'grid', gap: 12 }}>
          {cards}
        </div>
      )}
    </div>
  )
}

