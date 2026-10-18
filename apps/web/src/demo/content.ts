export type StepId =
  | 'welcome'
  | 'ecog'
  | 'guidance'
  | 'expectations'
  | 'sarcf'
  | 'baseline'
  | 'submit'
  | 'complete'

export const STEPS: StepId[] = [
  'welcome',
  'ecog',
  'guidance',
  'expectations',
  'sarcf',
  'baseline',
  'submit',
  'complete',
]

export const STEP_LABELS: Record<StepId, string> = {
  welcome: 'Welcome',
  ecog: 'ECOG',
  guidance: 'Guidance',
  expectations: 'Expectations',
  sarcf: 'SARC-F',
  baseline: 'Baseline',
  submit: 'Save',
  complete: 'Done',
}

/** DEMO ONLY — replace with IRB-approved study instruments (open decisions D1–D6). */
export const DEMO_ECOG_OPTIONS = [
  {
    value: 0,
    title: 'Fully active',
    body: 'Able to carry on all pre-disease performance without restriction.',
  },
  {
    value: 1,
    title: 'Restricted in strenuous activity',
    body: 'Able to carry out light work or sedentary work.',
  },
  {
    value: 2,
    title: 'Ambulatory and capable of self-care',
    body: 'Unable to carry out any work activities; up and about more than 50% of waking hours.',
  },
  {
    value: 3,
    title: 'Capable of only limited self-care',
    body: 'Confined to bed or chair more than 50% of waking hours.',
  },
  {
    value: 4,
    title: 'Completely disabled',
    body: 'Cannot carry on any self-care; totally confined to bed or chair.',
  },
] as const

/** DEMO ONLY — placeholder caregiver-facing language; not official NCCN/ASCO text (D4). */
export const DEMO_GUIDANCE = {
  version: 'demo-0.1',
  lowBurden: {
    headline: 'Systemic therapy may be considered',
    body: 'For ECOG 0–2, guidelines indicate the patient may potentially benefit from systemic anticancer therapies (SACTs). Treatment decisions should be made with the care team.',
  },
  highBurden: {
    headline: 'Guidelines recommend avoiding SACT',
    body: 'For ECOG 3–4, guidelines recommend avoiding systemic anticancer therapies because benefit is unlikely and harm is possible. Please discuss goals of care with the clinical team.',
  },
} as const

export const DEMO_EXPECTATION_OPTIONS = [
  { value: 'yes', label: 'Yes — this changes my expectations' },
  { value: 'no', label: 'No — my expectations are about the same' },
  { value: 'unsure', label: 'I am not sure' },
] as const

/** Matches REDCap field sarcf0 on sarcf_screen_for_sarcopenia. */
export const DEMO_SARCF_REPORTER_OPTIONS = [
  { value: 'patient', label: 'Patient report' },
  { value: 'caregiver', label: 'Caregiver report' },
] as const

/** DEMO ONLY — illustrative SARC-F-style items; confirm study instrument (D2). */
export const DEMO_SARCF_ITEMS = [
  {
    id: 'strength',
    prompt: 'How much difficulty does the patient have lifting or carrying 10 pounds?',
  },
  {
    id: 'assistance',
    prompt: 'How much difficulty does the patient have walking across a room?',
  },
  {
    id: 'rise',
    prompt: 'How much difficulty does the patient have transferring from a chair or bed?',
  },
  {
    id: 'climb',
    prompt: 'How much difficulty does the patient have climbing a flight of 10 stairs?',
  },
  {
    id: 'falls',
    prompt: 'How many times has the patient fallen in the past year?',
  },
] as const

export const DEMO_SARCF_OPTIONS = [
  { value: 0, label: 'None / 0' },
  { value: 1, label: 'Some / 1–3' },
  { value: 2, label: 'A lot or unable / 4+' },
] as const

/** DEMO ONLY — placeholders until baseline battery is defined (D3). */
export const DEMO_BASELINE_ITEMS = [
  {
    id: 'relationship',
    prompt: 'What is your relationship to the patient?',
    type: 'choice' as const,
    options: ['Spouse / partner', 'Adult child', 'Other family', 'Friend / other'],
  },
  {
    id: 'hours_at_bedside',
    prompt: 'About how many hours per day are you typically at the bedside?',
    type: 'choice' as const,
    options: ['Less than 2', '2–6', '6–12', 'Most of the day'],
  },
  {
    id: 'confidence',
    prompt: 'How confident do you feel discussing treatment options with the care team?',
    type: 'choice' as const,
    options: ['Not at all', 'A little', 'Somewhat', 'Very'],
  },
]
