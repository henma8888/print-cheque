import { describe, expect, it } from 'vitest'
import { formatDateDisplay, parseDateInput } from './date'

describe('parseDateInput', () => {
  it('parses digits without slashes', () => {
    expect(parseDateInput('25102026')).toEqual({
      day: '25',
      month: '10',
      year: '2026',
    })
    expect(parseDateInput('251026')).toEqual({
      day: '25',
      month: '10',
      year: '2026',
    })
  })

  it('parses slashes, dashes and dots', () => {
    expect(parseDateInput('25/10/2026')).toEqual({
      day: '25',
      month: '10',
      year: '2026',
    })
    expect(parseDateInput('25-10-26')).toEqual({
      day: '25',
      month: '10',
      year: '2026',
    })
    expect(parseDateInput('2026-10-25')).toEqual({
      day: '25',
      month: '10',
      year: '2026',
    })
  })

  it('formats with slashes between day, month and year', () => {
    expect(
      formatDateDisplay({ day: '25', month: '10', year: '2026' }),
    ).toBe('25/10/2026')
  })
})
