// One-off cleanup tool — deletes a single REDCap record by id.
// Run it yourself; it never prints the token or REDCap's raw response.
//
// Usage: npm run delete-record -w @ecog/api -- TEST-DELETE-ME-001
import { createInterface } from 'node:readline/promises'

try {
  process.loadEnvFile(new URL('../.env', import.meta.url))
} catch {
  // fall through — env vars may already be set another way
}

const recordId = process.argv[2]
if (!recordId) {
  console.error('Usage: npm run delete-record -w @ecog/api -- <record_id>')
  process.exit(1)
}

const url = process.env.REDCAP_API_URL
const token = process.env.REDCAP_API_TOKEN
if (!url || !token) {
  console.error('REDCAP_API_URL / REDCAP_API_TOKEN not set (check apps/api/.env)')
  process.exit(1)
}

const rl = createInterface({ input: process.stdin, output: process.stdout })
const answer = await rl.question(
  `About to permanently delete record "${recordId}" from REDCap. Type the record id again to confirm: `,
)
rl.close()

if (answer.trim() !== recordId) {
  console.error('Confirmation did not match — aborted, nothing deleted.')
  process.exit(1)
}

const body = new URLSearchParams({
  token,
  action: 'delete',
  content: 'record',
  'records[0]': recordId,
})

const res = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body,
})

const text = await res.text()

if (res.ok) {
  console.log(`Deleted "${recordId}" (REDCap reported ${text} record(s) removed).`)
} else {
  console.error(`Delete failed (HTTP ${res.status}): ${text}`)
  process.exit(1)
}
