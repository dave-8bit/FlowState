import { useCallback, useState } from 'react'
import { createTask } from './taskService.js'

export function useTaskActions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createTasks = useCallback(async (tasks) => {
    setLoading(true)
    setError(null)

    try {
      if (!Array.isArray(tasks) || tasks.length === 0) return []

      // Create sequentially to make error handling deterministic.
      const results = []
      for (const t of tasks) {
        results.push(
          await createTask({
            title: t?.title,
            description: t?.description,
            priority: t?.priority,
            deadline: t?.deadline,
          })
        )
      }

      return results
    } catch (e) {
      setError(e)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, createTasks }
}

