export interface ChequeDate {
  day: string
  month: string
  year: string
}

const EMPTY: ChequeDate = { day: '', month: '', year: '' }

function pad(value: string, len: number): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.padStart(len, '0').slice(-len)
}

/** Display as D/M/Y with slashes, even if the user typed digits only. */
export function formatDateDisplay(date: ChequeDate): string {
  const { day, month, year } = date
  if (!day && !month && !year) return ''
  return [day, month, year].map((p) => p || '').join('/')
}

/**
 * Accept digits with or without slashes / dashes / dots.
 * 25102026 or 25/10/2026 → 25, 10, 2026.
 * 6 digits are treated as DDMMYY (20xx).
 * A leading 4-digit year (2026-10-25) is also accepted.
 */
export function parseDateInput(raw: string): ChequeDate {
  if (!raw) return { ...EMPTY }
  const trimmed = raw.trim()
  if (!trimmed) return { ...EMPTY }

  const iso = trimmed.match(/^(\d{4})[\/\-.年](\d{1,2})[\/\-.月](\d{1,2})日?$/)
  if (iso) {
    return {
      day: pad(iso[3], 2),
      month: pad(iso[2], 2),
      year: iso[1],
    }
  }

  const dmy = trimmed.match(/^(\d{1,2})[\/\-.月](\d{1,2})[\/\-.年](\d{2,4})日?$/)
  if (dmy) {
    return {
      day: pad(dmy[1], 2),
      month: pad(dmy[2], 2),
      year: expandYear(dmy[3]),
    }
  }

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 8) {
    return {
      day: digits.slice(0, 2),
      month: digits.slice(2, 4),
      year: digits.slice(4, 8),
    }
  }
  if (digits.length === 6) {
    return {
      day: digits.slice(0, 2),
      month: digits.slice(2, 4),
      year: expandYear(digits.slice(4, 6)),
    }
  }
  if (digits.length <= 2) {
    return { day: digits, month: '', year: '' }
  }
  if (digits.length <= 4) {
    return { day: digits.slice(0, 2), month: digits.slice(2), year: '' }
  }
  return {
    day: digits.slice(0, 2),
    month: digits.slice(2, 4),
    year: digits.slice(4, 8),
  }
}

function expandYear(year: string): string {
  if (year.length === 2) return `20${year}`
  return year
}

export function isDateComplete(date: ChequeDate): boolean {
  return date.day.length > 0 && date.month.length > 0 && date.year.length >= 2
}

export function todayParts(now = new Date()): ChequeDate {
  return {
    day: String(now.getDate()).padStart(2, '0'),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear()),
  }
}

/** yyyy-mm-dd for <input type="date">; empty if the date is incomplete. */
export function toIsoDate(date: ChequeDate): string {
  if (!date.year || !date.month || !date.day) return ''
  const year = date.year.length === 2 ? `20${date.year}` : date.year
  if (year.length !== 4) return ''
  const month = date.month.padStart(2, '0')
  const day = date.day.padStart(2, '0')
  return `${year}-${month}-${day}`
}
