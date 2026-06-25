import { getToken } from '../features/auth/token.js'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000'


async function postJSON(path, body) {
  const token = getToken()

  const res = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed with status ${res.status}`)
  }

  return res.json()
}

const client = {
  postJSON,
}

export { baseURL }
export default client


