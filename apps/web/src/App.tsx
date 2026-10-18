import { useMemo, useState } from 'react'
import { submitResponses } from './api'
import { ChoiceCard, NavButtons, Shell } from './components/ui'
import {
  DEMO_BASELINE_ITEMS,
  DEMO_ECOG_OPTIONS,
  DEMO_EXPECTATION_OPTIONS,
  DEMO_GUIDANCE,
  DEMO_SARCF_ITEMS,
  DEMO_SARCF_OPTIONS,
  DEMO_SARCF_REPORTER_OPTIONS,
  STEPS,
  STEP_LABELS,
  type StepId,
} from './demo/content'
import { emptyResponses, guidanceBucket, type Responses } from './demo/state'

export default function App() {
  const [step, setStep] = useState<StepId>('welcome')
  const [responses, setResponses] = useState<Responses>(emptyResponses)
  const [submitting, setSubmitting] = useState(false)
  const [submitNote, setSubmitNote] = useState<string | null>(null)

  const stepIndex = STEPS.indexOf(step)
  const guidance =
    responses.ecog == null
      ? null
      : DEMO_GUIDANCE[guidanceBucket(responses.ecog)]

  const sarcfComplete = useMemo(
    () =>
      responses.reportedBy != null &&
      DEMO_SARCF_ITEMS.every((item) => responses.sarcf[item.id] != null),
    [responses.reportedBy, responses.sarcf],
  )

  const baselineComplete = useMemo(
    () => DEMO_BASELINE_ITEMS.every((item) => Boolean(responses.baseline[item.id])),
    [responses.baseline],
  )

  function go(delta: number) {
    const next = STEPS[stepIndex + delta]
    if (next) setStep(next)
  }

  async function submit() {
    setSubmitting(true)
    setSubmitNote(null)
    try {
      const result = await submitResponses(responses)
      setSubmitNote(
        `Saved to local demo API (not REDCap). Record ${result.id}.`,
      )
      setStep('complete')
    } catch (err) {
      setSubmitNote(
        err instanceof Error ? `Save failed: ${err.message}` : 'Save failed.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function restart() {
    setResponses(emptyResponses())
    setSubmitNote(null)
    setStep('welcome')
  }

  return (
    <Shell
      stepIndex={stepIndex}
      stepCount={STEPS.length}
      title={titleFor(step, responses.ecog)}
      footer={footerFor({
        step,
        responses,
        sarcfComplete,
        baselineComplete,
        submitting,
        onBack: () => go(-1),
        onNext: () => go(1),
        onSubmit: submit,
        onRestart: restart,
      })}
    >
      {step === 'welcome' && (
        <Welcome
          studyId={responses.studyId}
          onStudyId={(studyId) => setResponses((r) => ({ ...r, studyId }))}
        />
      )}

      {step === 'ecog' && (
        <section className="stack">
          <p className="lede">
            Select the option that best describes the patient’s current performance
            status.
          </p>
          <p className="callout">Demo wording — replace with study ECOG instrument (D1).</p>
          <div className="choice-list">
            {DEMO_ECOG_OPTIONS.map((opt) => (
              <ChoiceCard
                key={opt.value}
                name="ecog"
                selected={responses.ecog === opt.value}
                onSelect={() => setResponses((r) => ({ ...r, ecog: opt.value }))}
                meta={`ECOG ${opt.value}`}
                title={opt.title}
                body={opt.body}
              />
            ))}
          </div>
        </section>
      )}

      {step === 'guidance' && guidance && (
        <section className="stack">
          <div className={`guidance-card bucket-${guidanceBucket(responses.ecog!)}`}>
            <p className="guidance-score">ECOG score: {responses.ecog}</p>
            <h2>{guidance.headline}</h2>
            <p>{guidance.body}</p>
            <p className="guidance-meta">Config version: {DEMO_GUIDANCE.version}</p>
          </div>
          <p className="callout">
            Placeholder caregiver-facing text — not official NCCN/ASCO copy (D4).
          </p>
        </section>
      )}

      {step === 'expectations' && (
        <section className="stack">
          <p className="lede">
            Does this information change your expectations about the patient’s
            treatment?
          </p>
          <p className="callout">Demo question options — confirm study wording (D5).</p>
          <div className="choice-list">
            {DEMO_EXPECTATION_OPTIONS.map((opt) => (
              <ChoiceCard
                key={opt.value}
                name="expectations"
                selected={responses.expectationsChanged === opt.value}
                onSelect={() =>
                  setResponses((r) => ({ ...r, expectationsChanged: opt.value }))
                }
                title={opt.label}
              />
            ))}
          </div>
        </section>
      )}

      {step === 'sarcf' && (
        <section className="stack">
          <p className="lede">Answer each item about the patient.</p>
          <p className="callout">Illustrative SARC-F-style items — confirm instrument (D2).</p>
          <fieldset className="item-block">
            <legend>Who is completing this assessment?</legend>
            <div className="chip-row">
              {DEMO_SARCF_REPORTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`chip ${responses.reportedBy === opt.value ? 'is-selected' : ''}`}
                  onClick={() =>
                    setResponses((r) => ({ ...r, reportedBy: opt.value }))
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
          {DEMO_SARCF_ITEMS.map((item) => (
            <fieldset key={item.id} className="item-block">
              <legend>{item.prompt}</legend>
              <div className="chip-row">
                {DEMO_SARCF_OPTIONS.map((opt) => {
                  const selected = responses.sarcf[item.id] === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`chip ${selected ? 'is-selected' : ''}`}
                      onClick={() =>
                        setResponses((r) => ({
                          ...r,
                          sarcf: { ...r.sarcf, [item.id]: opt.value },
                        }))
                      }
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </section>
      )}

      {step === 'baseline' && (
        <section className="stack">
          <p className="lede">A few remaining baseline questions.</p>
          <p className="callout">
            Placeholders only — full baseline battery is undefined (D3).
          </p>
          {DEMO_BASELINE_ITEMS.map((item) => (
            <fieldset key={item.id} className="item-block">
              <legend>{item.prompt}</legend>
              <div className="choice-list compact">
                {item.options.map((option) => (
                  <ChoiceCard
                    key={option}
                    name={item.id}
                    selected={responses.baseline[item.id] === option}
                    onSelect={() =>
                      setResponses((r) => ({
                        ...r,
                        baseline: { ...r.baseline, [item.id]: option },
                      }))
                    }
                    title={option}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </section>
      )}

      {step === 'submit' && (
        <section className="stack">
          <p className="lede">Review and save study responses.</p>
          <dl className="summary">
            <div>
              <dt>Study ID</dt>
              <dd>{responses.studyId || '—'}</dd>
            </div>
            <div>
              <dt>ECOG</dt>
              <dd>{responses.ecog ?? '—'}</dd>
            </div>
            <div>
              <dt>Expectations changed</dt>
              <dd>{responses.expectationsChanged ?? '—'}</dd>
            </div>
            <div>
              <dt>SARC-F items answered</dt>
              <dd>
                {Object.values(responses.sarcf).filter((v) => v != null).length} /{' '}
                {DEMO_SARCF_ITEMS.length}
              </dd>
            </div>
            <div>
              <dt>Baseline items answered</dt>
              <dd>
                {Object.values(responses.baseline).filter(Boolean).length} /{' '}
                {DEMO_BASELINE_ITEMS.length}
              </dd>
            </div>
          </dl>
          <p className="callout">
            Demo mode simulates save. No PHI is sent; REDCap is not called.
          </p>
          {submitNote ? <p className="success-note">{submitNote}</p> : null}
        </section>
      )}

      {step === 'complete' && (
        <section className="stack complete">
          <div className="complete-mark" aria-hidden="true">
            ✓
          </div>
          <p className="lede">Thank you. This demo session is complete.</p>
          <p className="muted">
            In the real study, responses would already be written to REDCap and this
            screen would show IRB-approved completion text.
          </p>
        </section>
      )}
    </Shell>
  )
}

function titleFor(step: StepId, ecog: number | null): string {
  if (step === 'guidance' && ecog != null) {
    return ecog <= 2 ? 'Treatment guidance' : 'Treatment guidance'
  }
  return STEP_LABELS[step] === 'Done'
    ? 'Session complete'
    : step === 'welcome'
      ? 'Welcome'
      : step === 'ecog'
        ? 'ECOG Performance Status'
        : step === 'expectations'
          ? 'Treatment expectations'
          : step === 'sarcf'
            ? 'SARC-F assessment'
            : step === 'baseline'
              ? 'Baseline questions'
              : step === 'submit'
                ? 'Save responses'
                : STEP_LABELS[step]
}

function footerFor(args: {
  step: StepId
  responses: Responses
  sarcfComplete: boolean
  baselineComplete: boolean
  submitting: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  onRestart: () => void
}) {
  const {
    step,
    responses,
    sarcfComplete,
    baselineComplete,
    submitting,
    onBack,
    onNext,
    onSubmit,
    onRestart,
  } = args

  if (step === 'complete') {
    return (
      <div className="nav-row">
        <span />
        <button type="button" className="btn btn-primary" onClick={onRestart}>
          Start another demo
        </button>
      </div>
    )
  }

  if (step === 'submit') {
    return (
      <NavButtons
        onBack={onBack}
        onNext={onSubmit}
        nextLabel={submitting ? 'Saving…' : 'Save to REDCap (demo)'}
        nextDisabled={submitting || !responses.studyId.trim()}
      />
    )
  }

  const disabled =
    (step === 'welcome' && !responses.studyId.trim()) ||
    (step === 'ecog' && responses.ecog == null) ||
    (step === 'expectations' && !responses.expectationsChanged) ||
    (step === 'sarcf' && !sarcfComplete) ||
    (step === 'baseline' && !baselineComplete)

  return (
    <NavButtons
      onBack={onBack}
      onNext={onNext}
      hideBack={step === 'welcome'}
      nextDisabled={disabled}
    />
  )
}

function Welcome({
  studyId,
  onStudyId,
}: {
  studyId: string
  onStudyId: (value: string) => void
}) {
  return (
    <section className="stack">
      <p className="lede">
        This tablet walkthrough helps caregivers complete study assessments and review
        performance-status–based treatment guidance.
      </p>
      <ul className="bullets">
        <li>Answer each screen at your own pace</li>
        <li>Large buttons are meant for iPad use</li>
        <li>You can go back until you save</li>
      </ul>
      <label className="field">
        <span>Study ID (demo — access model TBD, R2)</span>
        <input
          value={studyId}
          onChange={(e) => onStudyId(e.target.value)}
          placeholder="e.g. DEMO-001"
          autoComplete="off"
          inputMode="text"
        />
      </label>
      <p className="callout">
        Welcome copy is placeholder (D6). Instruments and REDCap mapping are not final.
      </p>
    </section>
  )
}
