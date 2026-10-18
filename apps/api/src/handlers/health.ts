import { json, type ApiEvent, type ApiResult } from './types.ts'

export async function handler(_event: ApiEvent): Promise<ApiResult> {
  return json(200, { ok: true, service: '@ecog/api', time: new Date().toISOString() })
}
