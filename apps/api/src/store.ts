import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Local stand-in for REDCap so the demo has somewhere to save to.
// Per docs/ARCHITECTURE.md, REDCap is the intended system of record —
// this file-backed store exists only for local dev before that's wired up.
// Do not point this at real PHI.
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.data')
const DATA_FILE = join(DATA_DIR, 'submissions.json')

async function readAll(): Promise<unknown[]> {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf-8'))
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
}

export async function appendSubmission(record: unknown): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true })
  const all = await readAll()
  all.push(record)
  await writeFile(DATA_FILE, JSON.stringify(all, null, 2))
}
