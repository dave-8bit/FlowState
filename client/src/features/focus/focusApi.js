import client from '../../api/client.js'

export async function startSession({ title, timerMinutes, taskId }) {
  // title is optional per backend; we pass a reasonable default.
  // task association is supported client-side persistence only for now.
  // Backend currently persists creatorId + participants + title + timerMinutes.
  return client.postJSON('/api/sessions', {
    title,
    timerMinutes,
    // taskId is intentionally not sent unless backend supports it.
    ...(taskId ? { taskId } : {}),
  })
}

export async function closeSession({ sessionId }) {
  return client.postJSON(`/api/sessions/${sessionId}/close`, {
    isActive: false,
  })
}

