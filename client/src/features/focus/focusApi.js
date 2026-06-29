import client from '../../api/client.js'

export async function startSession({ title, timerMinutes, taskId, blockId }) {
  // title is optional per backend; we pass a reasonable default.
  // Backend persists creatorId + participants + title + timerMinutes.
  // taskId + blockId are optional for backward compatibility.
  return client.postJSON('/api/sessions', {
    title,
    timerMinutes,
    // taskId/blockId are optional (legacy clients may omit them)
    ...(taskId ? { taskId } : {}),
    ...(blockId ? { blockId } : {}),
  })
}

export async function closeSession({ sessionId }) {
  return client.postJSON(`/api/sessions/${sessionId}/close`, {
    isActive: false,
  })
}

