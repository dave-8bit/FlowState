import client from '../../api/client.js'

export async function generateBrainDump(input) {
  return client.postJSON('/api/brain-dump', { input })
}

