import {
  DEFAULT_LAYOUT,
  PAPER_PRESETS,
  type LayoutSettings,
  type PaperPreset,
} from './types'

export function applyPaperPreset(
  settings: LayoutSettings,
  preset: PaperPreset,
): LayoutSettings {
  const paper = PAPER_PRESETS[preset]
  const align = detectPaperAlign(settings)
  const next: LayoutSettings = {
    ...settings,
    paperPreset: preset,
    paperWidthMm: paper.widthMm,
    paperHeightMm: paper.heightMm,
  }
  return applyPaperAlign(next, align.vertical, align.horizontal)
}

export function chequeSizeMm(settings: LayoutSettings): {
  widthMm: number
  heightMm: number
} {
  return {
    widthMm: settings.chequeWidthCm * 10,
    heightMm: settings.chequeHeightCm * 10,
  }
}

export interface OverflowWarning {
  paper: boolean
  fields: boolean
  message: string
}

export function checkOverflow(settings: LayoutSettings): OverflowWarning {
  const { widthMm, heightMm } = chequeSizeMm(settings)
  const right = settings.marginRightMm
  const top = settings.marginTopMm
  const left = settings.marginLeftMm
  const usedWidth = left + widthMm + right
  const usedHeight = top + heightMm
  const paper = usedWidth > settings.paperWidthMm + 0.05 || usedHeight > settings.paperHeightMm + 0.05

  const boxes = [
    {
      x: settings.dateXmm,
      y: settings.dateYmm,
      w:
        settings.gapBeforeDayMm +
        14 +
        settings.gapDayMonthMm +
        14 +
        settings.gapMonthYearMm +
        settings.yearWidthMm,
      h: settings.dateRowHeightMm,
    },
    {
      x: settings.payeeXmm,
      y: settings.payeeYmm,
      w: Math.max(40, settings.chequeWidthCm * 10 - settings.payeeXmm - 8),
      h: settings.payeeRowHeightMm,
    },
    {
      x: settings.chineseXmm,
      y: settings.chineseYmm,
      w: settings.chineseWidthMm,
      h: settings.amountRowHeightMm,
    },
    {
      x: settings.numberXmm,
      y: settings.numberYmm,
      w: settings.numberWidthMm,
      h: settings.amountRowHeightMm,
    },
  ]

  const fields = boxes.some(
    (b) => b.x < -0.5 || b.y < -0.5 || b.x + b.w > widthMm + 0.5 || b.y + b.h > heightMm + 0.5,
  )

  const parts: string[] = []
  if (paper) parts.push('支票同邊距加起來超出紙張')
  if (fields) parts.push('有欄位超出支票範圍')
  return {
    paper,
    fields,
    message: parts.join('；') + (parts.length ? '。' : ''),
  }
}

export type VerticalPaperAlign = 'top' | 'middle' | 'bottom'
export type HorizontalPaperAlign = 'left' | 'right'

function near(a: number, b: number, tol = 0.6): boolean {
  return Math.abs(a - b) < tol
}

function roundMm(n: number): number {
  return Math.round(n * 10) / 10
}

export function maxChequeOffset(settings: LayoutSettings): { left: number; top: number } {
  const { widthMm, heightMm } = chequeSizeMm(settings)
  return {
    left: Math.max(0, settings.paperWidthMm - widthMm),
    top: Math.max(0, settings.paperHeightMm - heightMm),
  }
}

export function detectPaperAlign(settings: LayoutSettings): {
  vertical: VerticalPaperAlign | 'custom'
  horizontal: HorizontalPaperAlign | 'custom'
} {
  const max = maxChequeOffset(settings)
  const horizontal: HorizontalPaperAlign | 'custom' = near(settings.marginLeftMm, 0)
    ? 'left'
    : near(settings.marginLeftMm, max.left)
      ? 'right'
      : 'custom'
  const vertical: VerticalPaperAlign | 'custom' = near(settings.marginTopMm, 0)
    ? 'top'
    : near(settings.marginTopMm, max.top)
      ? 'bottom'
      : near(settings.marginTopMm, max.top / 2)
        ? 'middle'
        : 'custom'
  return { vertical, horizontal }
}

/** Move the cheque / print area on the paper. Does not move fields inside the cheque. */
export function applyPaperAlign(
  settings: LayoutSettings,
  vertical?: VerticalPaperAlign | 'custom',
  horizontal?: HorizontalPaperAlign | 'custom',
): LayoutSettings {
  const { widthMm } = chequeSizeMm(settings)
  const max = maxChequeOffset(settings)
  let top = settings.marginTopMm
  let left = settings.marginLeftMm
  if (vertical === 'top') top = 0
  else if (vertical === 'middle') top = roundMm(max.top / 2)
  else if (vertical === 'bottom') top = roundMm(max.top)
  if (horizontal === 'left') left = 0
  else if (horizontal === 'right') left = roundMm(max.left)
  const right = Math.max(0, roundMm(settings.paperWidthMm - widthMm - left))
  return { ...settings, marginTopMm: top, marginLeftMm: left, marginRightMm: right }
}

export function mergeLayout(
  partial: Partial<LayoutSettings> | null | undefined,
  version = 1,
): LayoutSettings {
  const layout = { ...DEFAULT_LAYOUT, ...(partial ?? {}) }
  // v1 stored a left margin that was not used for placement; the cheque was pinned from the right.
  if (version < 2) {
    const { widthMm } = chequeSizeMm(layout)
    layout.marginLeftMm = Math.max(0, roundMm(layout.paperWidthMm - widthMm - layout.marginRightMm))
  }
  return layout
}
