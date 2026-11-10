const DIGITS = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'] as const

/** Strip currency marks and thousand separators, then round to the nearest cent. */
export function parseAmount(input: string): number | null {
  if (input == null) return null
  let s = String(input).trim()
  if (!s) return null
  s = s.replace(/HK\$?/gi, '')
  s = s.replace(/[\s,$￥¥港幣]/g, '')
  s = s.replace(/[–—]/g, '-')
  if (!s || s === '-' || s === '.') return null
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}

function sectionToChinese(n: number): string {
  if (n === 0) return ''
  const parts: Array<[number, string]> = [
    [Math.floor(n / 1000), '仟'],
    [Math.floor((n % 1000) / 100), '佰'],
    [Math.floor((n % 100) / 10), '拾'],
    [n % 10, ''],
  ]
  let s = ''
  let needZero = false
  for (const [digit, unit] of parts) {
    if (digit === 0) {
      if (s) needZero = true
      continue
    }
    if (needZero) {
      s += '零'
      needZero = false
    }
    s += DIGITS[digit] + unit
  }
  return s
}

/** Convert a non-negative integer into formal Chinese numerals with 拾佰仟萬億. */
export function integerToChinese(n: number): string {
  if (n === 0) return '零'
  if (!Number.isInteger(n) || n < 0) {
    throw new RangeError('integerToChinese expects a non-negative integer')
  }
  const parts: Array<[number, string]> = [
    [Math.floor(n / 100_000_000), '億'],
    [Math.floor((n % 100_000_000) / 10_000), '萬'],
    [n % 10_000, ''],
  ]
  let s = ''
  let needZero = false
  for (const [section, unit] of parts) {
    if (section === 0) {
      if (s) needZero = true
      continue
    }
    if ((needZero || (s && section < 1000)) && !s.endsWith('零')) {
      s += '零'
    }
    needZero = false
    s += sectionToChinese(section) + unit
  }
  return s
}

/**
 * Formal Chinese cheque amount, always ending with 正.
 * Uses 零壹貳參肆伍陸柒捌玖 and units 拾佰仟萬億／元／角／分.
 */
export function amountToChinese(amount: number): string {
  const cents = Math.round(amount * 100)
  if (cents < 0 || !Number.isFinite(cents)) {
    throw new RangeError('amount must be a non-negative finite number')
  }
  if (cents === 0) return '零元正'

  const yuan = Math.floor(cents / 100)
  const jiao = Math.floor((cents % 100) / 10)
  const fen = cents % 10

  let s = ''
  if (yuan > 0) {
    s += integerToChinese(yuan) + '元'
    if (jiao === 0 && fen > 0) s += '零'
  }
  if (jiao > 0) s += DIGITS[jiao] + '角'
  if (fen > 0) s += DIGITS[fen] + '分'
  return s + '正'
}

export function formatNumericAmount(amount: number): string {
  return amount.toLocaleString('en-HK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function chineseFromInput(input: string): string {
  const n = parseAmount(input)
  if (n == null) return ''
  return amountToChinese(n)
}
