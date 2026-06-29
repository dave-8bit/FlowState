import { baseURL } from '../../api/client.js'
import { getToken } from '../auth/token.js'

export async function fetchSessions({ includeCompleted } = {}) {
  const token = getToken()

  const qs = includeCompleted ? '?includeCompleted=true' : ''
  const res = await fetch(`${baseURL}/api/sessions${qs}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed with status ${res.status}`)
  }

  return res.json()
}

