import { useCallback, useState } from 'react'
import { generateBrainDump } from './brainDumpService.js'

export function useBrainDump() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState([])

  const generate = useCallback(async (input) => {
    setLoading(true)
    setError(null)
    try {
      const data = await generateBrainDump(input)
      setTasks(Array.isArray(data?.tasks) ? data.tasks : [])
      return data
    } catch (e) {
      setError(e)
      setTasks([])
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, tasks, generate }
}

