import type { Responses } from './demo/state'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export async function submitResponses(
  responses: Responses,
): Promise<{ id: string; submittedAt: string }> {
  const res = await fetch(`${API_URL}/submissions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(responses),
  })

  const data = await res.json()
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? 'Save failed')
  }
  return { id: data.id, submittedAt: data.submittedAt }
}
