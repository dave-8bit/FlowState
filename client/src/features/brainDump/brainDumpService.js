import client from '../../api/client.js'

export async function generateBrainDump(input) {
  // Ensure we always return the parsed JSON body (not the raw Response)
  // so callers/hooks can reliably access fields like `tasks`.
  const data = await client.postJSON('/api/brain-dump', { input })
  return data
}


