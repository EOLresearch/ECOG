// Local-only dev server. Adapts plain HTTP requests into the same
// { httpMethod, path, body } shape API Gateway would hand these Lambda
// handlers in AWS, so handler code doesn't change when it's actually deployed.
import cors from 'cors'
import express from 'express'
import { handler as healthHandler } from './handlers/health.ts'
import { handler as submissionsHandler } from './handlers/submissions.ts'

try {
  process.loadEnvFile(new URL('../.env', import.meta.url))
} catch {
  // .env is optional — falls back to the local mock store (see redcap.ts).
}

const PORT = Number(process.env.PORT ?? 8787)

const app = express()
app.use(cors())
app.use(express.text({ type: '*/*' }))

app.post('/submissions', async (req, res) => {
  const result = await submissionsHandler({
    httpMethod: 'POST',
    path: '/submissions',
    body: typeof req.body === 'string' && req.body.length > 0 ? req.body : null,
  })
  res.status(result.statusCode).set(result.headers).send(result.body)
})

app.get('/health', async (_req, res) => {
  const result = await healthHandler({ httpMethod: 'GET', path: '/health', body: null })
  res.status(result.statusCode).set(result.headers).send(result.body)
})

app.listen(PORT, () => {
  console.log(`@ecog/api (local, mock REDCap store) listening on http://localhost:${PORT}`)
})
