import { describe, expect, it } from 'vitest'
import { applyPaperAlign, applyPaperPreset, checkOverflow, detectPaperAlign, mergeLayout } from './layout'
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

describe('applyPaperAlign', () => {
  it('pins the print area to the paper edges and centre', () => {
    const top = applyPaperAlign(DEFAULT_LAYOUT, 'top', undefined)
    expect(top.marginTopMm).toBe(0)
    expect(detectPaperAlign(top).vertical).toBe('top')

    const mid = applyPaperAlign(DEFAULT_LAYOUT, 'middle', undefined)
    expect(mid.marginTopMm).toBe(29.5) // (148 - 89) / 2
    expect(detectPaperAlign(mid).vertical).toBe('middle')

    const bottom = applyPaperAlign(DEFAULT_LAYOUT, 'bottom', undefined)
    expect(bottom.marginTopMm).toBe(59) // 148 - 89
    expect(detectPaperAlign(bottom).vertical).toBe('bottom')

    const left = applyPaperAlign(DEFAULT_LAYOUT, undefined, 'left')
    expect(left.marginLeftMm).toBe(0)
    expect(left.marginRightMm).toBe(40) // 210 - 170
    expect(detectPaperAlign(left).horizontal).toBe('left')

    const right = applyPaperAlign(DEFAULT_LAYOUT, undefined, 'right')
    expect(right.marginLeftMm).toBe(40)
    expect(right.marginRightMm).toBe(0)
    expect(detectPaperAlign(right).horizontal).toBe('right')
  })
})

describe('mergeLayout', () => {
  it('derives the left offset from the right margin for v1 settings', () => {
    const layout = mergeLayout({ marginRightMm: 0, marginLeftMm: 0, marginTopMm: 8 }, 1)
    expect(layout.marginLeftMm).toBe(40)
    expect(detectPaperAlign(layout).horizontal).toBe('right')
  })
})
