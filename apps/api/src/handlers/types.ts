// Minimal shape of what API Gateway (HTTP API) passes a Lambda handler.
// Kept local (no @types/aws-lambda dependency) since only these fields are used.
export interface ApiEvent {
  httpMethod: string
  path: string
  body: string | null
}

export interface ApiResult {
  statusCode: number
  body: string
  headers?: Record<string, string>
}

export function json(statusCode: number, body: unknown): ApiResult {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}
