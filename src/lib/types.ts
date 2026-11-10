export type PaperPreset = 'a5-landscape' | 'dl' | 'c5' | 'cheque'

export interface ChequeRow {
  id: string
  day: string
  month: string
  year: string
  payee: string
  amount: string
  chinese: string
  chineseManual: boolean
}

export interface LayoutSettings {
  paperPreset: PaperPreset
  paperWidthMm: number
  paperHeightMm: number
  chequeWidthCm: number
  chequeHeightCm: number
  marginRightMm: number
  marginLeftMm: number
  marginTopMm: number
  fontSizePt: number
  dateXmm: number
  dateYmm: number
  payeeXmm: number
  payeeYmm: number
  chineseXmm: number
  chineseYmm: number
  numberXmm: number
  numberYmm: number
  gapBeforeDayMm: number
  gapDayMonthMm: number
  gapMonthYearMm: number
  yearWidthMm: number
  gapBeforePayeeMm: number
  gapBeforeChineseMm: number
  chineseWidthMm: number
  numberWidthMm: number
  dateRowHeightMm: number
  payeeRowHeightMm: number
  amountRowHeightMm: number
  backgroundDataUrl: string
}

export const PAPER_PRESETS: Record<
  PaperPreset,
  { label: string; widthMm: number; heightMm: number }
> = {
  'a5-landscape': { label: 'A5 橫向', widthMm: 210, heightMm: 148 },
  dl: { label: 'DL 信封', widthMm: 220, heightMm: 110 },
  c5: { label: 'C5 信封', widthMm: 229, heightMm: 162 },
  cheque: { label: '支票原尺寸', widthMm: 170, heightMm: 89 },
}

export const DEFAULT_LAYOUT: LayoutSettings = {
  paperPreset: 'a5-landscape',
  paperWidthMm: 210,
  paperHeightMm: 148,
  chequeWidthCm: 17,
  chequeHeightCm: 8.9,
  marginRightMm: 0,
  marginLeftMm: 40,
  marginTopMm: 8,
  fontSizePt: 12,
  dateXmm: 112,
  dateYmm: 8,
  payeeXmm: 28,
  payeeYmm: 28,
  chineseXmm: 20,
  chineseYmm: 52,
  numberXmm: 118,
  numberYmm: 48,
  gapBeforeDayMm: 0,
  gapDayMonthMm: 4,
  gapMonthYearMm: 4,
  yearWidthMm: 22,
  gapBeforePayeeMm: 6,
  gapBeforeChineseMm: 6,
  chineseWidthMm: 95,
  numberWidthMm: 42,
  dateRowHeightMm: 8,
  payeeRowHeightMm: 8,
  amountRowHeightMm: 10,
  backgroundDataUrl: '',
}

export const STORAGE_KEY = 'print-cheque:v1'
export const SETTINGS_VERSION = 2
