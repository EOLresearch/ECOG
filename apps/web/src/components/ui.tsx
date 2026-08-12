import { useId, type ReactNode } from 'react'

type ShellProps = {
  stepIndex: number
  stepCount: number
  title: string
  children: ReactNode
  footer: ReactNode
}

export function Shell({ stepIndex, stepCount, title, children, footer }: ShellProps) {
  const progress = Math.round(((stepIndex + 1) / stepCount) * 100)

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand-block">
          <p className="brand">ECOG and Outcomes</p>
          <p className="demo-pill">Demo · mock instruments</p>
        </div>
        <p className="step-meta">
          Step {stepIndex + 1} of {stepCount}
        </p>
      </header>

      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <main className="panel">
        <h1 className="panel-title">{title}</h1>
        {children}
      </main>

      <footer className="footer">{footer}</footer>
    </div>
  )
}

type ChoiceCardProps = {
  name: string
  selected: boolean
  onSelect: () => void
  title: string
  body?: string
  meta?: string
}

export function ChoiceCard({
  name,
  selected,
  onSelect,
  title,
  body,
  meta,
}: ChoiceCardProps) {
  const id = useId()
  return (
    <label className={`choice ${selected ? 'is-selected' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="radio"
        name={name}
        checked={selected}
        onChange={onSelect}
      />
      <span className="choice-copy">
        {meta ? <span className="choice-meta">{meta}</span> : null}
        <span className="choice-title">{title}</span>
        {body ? <span className="choice-body">{body}</span> : null}
      </span>
    </label>
  )
}

type NavProps = {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
}

export function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  hideBack = false,
}: NavProps) {
  return (
    <div className="nav-row">
      {!hideBack && onBack ? (
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </button>
    </div>
  )
}
