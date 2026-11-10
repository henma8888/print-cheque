import { parseDateInput, type ChequeDate } from '../lib/date'

function liveMask(raw: string): string {
  const date = parseDateInput(raw)
  if (date.year) return `${date.day}/${date.month}/${date.year}`
  if (date.month) return `${date.day}/${date.month}`
  return date.day
}

interface Props {
  date: ChequeDate
  onChange: (date: ChequeDate) => void
  ariaLabel?: string
}

export default function DateInput({ date, onChange, ariaLabel = '日期' }: Props) {
  const display = liveMask(`${date.day}${date.month}${date.year}`)

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      spellCheck={false}
      placeholder="25102026"
      aria-label={ariaLabel}
      value={display}
      onChange={(e) => onChange(parseDateInput(e.target.value))}
    />
  )
}
