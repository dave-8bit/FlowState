import { useCallback, useEffect, useRef, useState } from 'react'
import { useSocket } from '../socket/useSocket.js'
import { generateBrainDump } from './brainDumpService.js'

export function useBrainDump() {
  const socket = useSocket()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tasks, setTasks] = useState([])

  // Prevent duplicate task generation if socket events arrive more than once.
  const generateInFlightRef = useRef(false)

  const generate = useCallback(async (input) => {
    if (generateInFlightRef.current) return null
    generateInFlightRef.current = true

    setLoading(true)
    setError(null)
    try {
      const data = await generateBrainDump(input)
      // HTTP response remains the source of truth; socket events only synchronize UI state.
      setTasks(Array.isArray(data?.tasks) ? data.tasks : [])
      return data
    } catch (e) {
      // Keep UI generic; log technical details only.
      console.error(e)
      setError(new Error('Unable to generate tasks right now. Please try again.'))
      setTasks([])
      return null
    } finally {
      setLoading(false)
      generateInFlightRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleStarted = () => {
      setLoading(true)
      setError(null)
    }

    const handleCompleted = ({ tasks: nextTasks } = {}) => {
      if (!Array.isArray(nextTasks)) return
      setTasks(nextTasks)
      setLoading(false)
      setError(null)
      generateInFlightRef.current = false
    }

    const handleFailed = () => {
      setLoading(false)
      setError(new Error('Unable to generate tasks right now. Please try again.'))
      setTasks([])
      generateInFlightRef.current = false
    }

    socket.subscribe('brainDump:started', handleStarted)
    socket.subscribe('brainDump:completed', handleCompleted)
    socket.subscribe('brainDump:failed', handleFailed)

    return () => {
      socket.unsubscribe('brainDump:started', handleStarted)
      socket.unsubscribe('brainDump:completed', handleCompleted)
      socket.unsubscribe('brainDump:failed', handleFailed)
    }
  }, [socket])

  return { loading, error, tasks, generate }
}


