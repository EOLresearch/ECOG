// Real REDCap write path. Only the fields confirmed against the project's
// Data Dictionary are sent — expectationsChanged/baseline have no REDCap
// field yet (D3/D5 open) and are intentionally not written here.
//
// process.env is read inside functions (not cached into top-level consts):
// ES module imports evaluate before the importing file's own top-level code
// runs, so a top-level const here would capture process.env before
// local-server.ts's loadEnvFile() call ever executes.
function redcapConfig() {
  return {
    url: process.env.REDCAP_API_URL,
    token: process.env.REDCAP_API_TOKEN,
    eventName: process.env.REDCAP_EVENT_NAME,
  }
}

export function isRedcapConfigured(): boolean {
  const { url, token, eventName } = redcapConfig()
  return Boolean(url && token && eventName)
}

interface RedcapSubmission {
  studyId: string
  ecog: number
  reportedBy: string | null
  sarcf: Record<string, number | null>
}

// REDCap's choice codes are 1-indexed; the frontend uses 0-indexed scores.
// ecog_2 choices: 1=ECOG0 ... 5=ECOG4. sarcf_3..sarcf_7: 1=None ... 3=A lot.
const SARCF_FIELD_BY_ITEM: Record<string, string> = {
  strength: 'sarcf_3',
  assistance: 'sarcf_4',
  rise: 'sarcf_5',
  climb: 'sarcf_6',
  falls: 'sarcf_7',
}

export async function writeToRedcap(
  payload: RedcapSubmission,
): Promise<{ recordId: string }> {
  const { url, token, eventName } = redcapConfig()
  if (!url || !token || !eventName) {
    throw new Error('REDCap is not configured (see apps/api/.env.example)')
  }

  const record: Record<string, string> = {
    // R2 (open decision) — assumes the tablet's studyId is the REDCap record_id.
    record_id: payload.studyId,
    redcap_event_name: eventName,
    ecog_2: String(payload.ecog + 1),
  }

  // sarcf0 is a REDCap checkbox field: each option is its own
  // <field>___<code> variable holding 1 (checked) / 0 (unchecked),
  // not a single field taking the option code as its value.
  if (payload.reportedBy === 'patient' || payload.reportedBy === 'caregiver') {
    record['sarcf0___1'] = payload.reportedBy === 'patient' ? '1' : '0'
    record['sarcf0___2'] = payload.reportedBy === 'caregiver' ? '1' : '0'
  }

  for (const [itemId, field] of Object.entries(SARCF_FIELD_BY_ITEM)) {
    const value = payload.sarcf[itemId]
    if (value != null) record[field] = String(value + 1)
  }

  const body = new URLSearchParams({
    token,
    content: 'record',
    format: 'json',
    type: 'flat',
    overwriteBehavior: 'normal',
    data: JSON.stringify([record]),
    returnContent: 'ids',
    returnFormat: 'json',
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`REDCap write failed (${res.status}): ${text}`)
  }

  let ids: unknown
  try {
    ids = JSON.parse(text)
  } catch {
    throw new Error(`Unexpected REDCap response: ${text}`)
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error(`REDCap did not return a record id: ${text}`)
  }

  return { recordId: String(ids[0]) }
}
