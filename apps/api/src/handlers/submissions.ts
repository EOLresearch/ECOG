import { randomUUID } from 'node:crypto'
import { isRedcapConfigured, writeToRedcap } from '../redcap.ts'
import { appendSubmission } from '../store.ts'
import { json, type ApiEvent, type ApiResult } from './types.ts'

interface SubmissionPayload {
  studyId: string
  ecog: number | null
  expectationsChanged: string | null
  reportedBy: string | null
  sarcf: Record<string, number | null>
  baseline: Record<string, string | null>
}

function isValidPayload(value: unknown): value is SubmissionPayload {
  if (typeof value !== 'object' || value === null) return false
  const p = value as Record<string, unknown>
  return (
    typeof p.studyId === 'string' &&
    p.studyId.trim().length > 0 &&
    typeof p.ecog === 'number' &&
    p.ecog >= 0 &&
    p.ecog <= 4 &&
    typeof p.sarcf === 'object' &&
    p.sarcf !== null &&
    typeof p.baseline === 'object' &&
    p.baseline !== null
  )
}

export async function handler(event: ApiEvent): Promise<ApiResult> {
  let payload: unknown
  try {
    payload = event.body ? JSON.parse(event.body) : null
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body' })
  }

  if (!isValidPayload(payload)) {
    return json(400, { ok: false, error: 'Invalid submission payload' })
  }

  const submittedAt = new Date().toISOString()

  if (isRedcapConfigured()) {
    try {
      const { recordId } = await writeToRedcap({
        studyId: payload.studyId,
        ecog: payload.ecog as number,
        reportedBy: payload.reportedBy,
        sarcf: payload.sarcf,
      })
      // Audit event only — no answer payload in the log, per docs/ARCHITECTURE.md.
      console.log(JSON.stringify({ event: 'redcap_write_ok', recordId, submittedAt }))
      return json(200, { ok: true, id: recordId, submittedAt, backend: 'redcap' })
    } catch (err) {
      console.error(JSON.stringify({ event: 'redcap_write_failed', error: String(err) }))
      return json(502, { ok: false, error: 'REDCap write failed' })
    }
  }

  const record = { id: randomUUID(), submittedAt, ...payload }
  await appendSubmission(record)
  console.log(JSON.stringify({ event: 'submission_saved_local', id: record.id, submittedAt }))
  return json(200, { ok: true, id: record.id, submittedAt, backend: 'local-mock' })
}
