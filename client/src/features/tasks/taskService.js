import client from '../../api/client.js'

export async function createTask({ title, description, priority, deadline }) {
  // Backend contract expects: { title, description, priority, deadline }
  // deadline should be a string (parsable by new Date) or undefined.
  return client.postJSON('/api/tasks', {
    title,
    description,
    priority,
    deadline,
  })
}

