export type Responses = {
  studyId: string
  ecog: number | null
  expectationsChanged: string | null
  sarcf: Record<string, number | null>
  baseline: Record<string, string | null>
}

export function emptyResponses(): Responses {
  return {
    studyId: '',
    ecog: null,
    expectationsChanged: null,
    sarcf: {},
    baseline: {},
  }
}

export function guidanceBucket(ecog: number): 'lowBurden' | 'highBurden' {
  return ecog <= 2 ? 'lowBurden' : 'highBurden'
}
