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
  return {
    ...settings,
    paperPreset: preset,
    paperWidthMm: paper.widthMm,
    paperHeightMm: paper.heightMm,
  }
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

export function mergeLayout(partial: Partial<LayoutSettings> | null | undefined): LayoutSettings {
  return { ...DEFAULT_LAYOUT, ...(partial ?? {}) }
}
