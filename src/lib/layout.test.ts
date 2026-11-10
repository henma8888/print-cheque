import { describe, expect, it } from 'vitest'
import { applyPaperPreset, checkOverflow } from './layout'
import { DEFAULT_LAYOUT } from './types'

describe('checkOverflow', () => {
  it('is clear with the default A5 layout', () => {
    const warn = checkOverflow(DEFAULT_LAYOUT)
    expect(warn.paper).toBe(false)
    expect(warn.message).toBe('')
  })

  it('warns when the cheque is larger than the paper', () => {
    const settings = applyPaperPreset(
      { ...DEFAULT_LAYOUT, chequeWidthCm: 25, chequeHeightCm: 20, marginTopMm: 0, marginRightMm: 0 },
      'cheque',
    )
    const warn = checkOverflow(settings)
    expect(warn.paper).toBe(true)
    expect(warn.message).toContain('超出紙張')
  })
})
