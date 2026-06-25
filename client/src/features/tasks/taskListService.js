import { getToken } from '../auth/token.js'
import { baseURL } from '../../api/client.js'

export async function fetchTasks() {
  const token = getToken()

  const res = await fetch(`${baseURL}/api/tasks`, {
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


