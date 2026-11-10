import { chineseFromInput, parseAmount } from './amount'
import { parseDateInput, type ChequeDate } from './date'
import type { ChequeRow } from './types'

export function newRow(partial: Partial<ChequeRow> = {}): ChequeRow {
  const amount = partial.amount ?? ''
  const chinese = partial.chinese ?? (amount ? chineseFromInput(amount) : '')
  return {
    id: partial.id ?? crypto.randomUUID(),
    day: '',
    month: '',
    year: '',
    payee: '',
    chineseManual: false,
    ...partial,
    amount,
    chinese,
  }
}

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .replace(/　/g, '')
}

function cell(row: unknown[], index: number | undefined): string {
  if (index == null || index < 0) return ''
  const v = row[index]
  if (v == null || v === '') return ''
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${String(v.getDate()).padStart(2, '0')}/${String(v.getMonth() + 1).padStart(2, '0')}/${v.getFullYear()}`
  }
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  return String(v).trim()
}

function excelSerialToDate(serial: number): ChequeDate | null {
  if (!Number.isFinite(serial) || serial < 20000 || serial > 80000) return null
  const utc = new Date(Math.round((serial - 25569) * 86400 * 1000))
  if (Number.isNaN(utc.getTime())) return null
  return {
    day: String(utc.getUTCDate()).padStart(2, '0'),
    month: String(utc.getUTCMonth() + 1).padStart(2, '0'),
    year: String(utc.getUTCFullYear()),
  }
}

function dateFromCells(rawDate: string, day: string, month: string, year: string): ChequeDate {
  if (day || month || year) {
    const parsedYear = year ? parseDateInput(year).year || year : ''
    return {
      day: day.replace(/\D/g, '').padStart(2, '0').slice(-2),
      month: month.replace(/\D/g, '').padStart(2, '0').slice(-2),
      year: parsedYear.replace(/\D/g, ''),
    }
  }
  if (rawDate) {
    const asNumber = Number(rawDate)
    if (rawDate.trim() !== '' && Number.isFinite(asNumber) && !rawDate.includes('/') && asNumber > 20000) {
      const serial = excelSerialToDate(asNumber)
      if (serial) return serial
    }
    return parseDateInput(rawDate)
  }
  return { day: '', month: '', year: '' }
}

function toRow(date: ChequeDate, payee: string, amountRaw: string): ChequeRow | null {
  const payeeText = payee.trim()
  const amount = amountRaw.trim()
  if (!date.day && !date.month && !date.year && !payeeText && !amount) return null
  return newRow({
    ...date,
    payee: payeeText,
    amount,
    chinese: amount ? chineseFromInput(amount) : '',
    chineseManual: false,
  })
}

export function parseTableRows(rows: unknown[][]): ChequeRow[] {
  if (!rows.length) return []
  const first = rows[0].map(normalizeHeader)
  const idx = {
    date: first.findIndex((h) => h === '日期' || h === 'date'),
    day: first.findIndex((h) => h === '日' || h === 'day'),
    month: first.findIndex((h) => h === '月' || h === 'month'),
    year: first.findIndex((h) => h === '年' || h === 'year'),
    payee: first.findIndex((h) => h === '抬頭' || h === 'payee' || h === '收款人'),
    amount: first.findIndex((h) => h === '銀碼' || h === '金額' || h === 'amount'),
  }
  const hasHeader = idx.payee >= 0 || idx.amount >= 0 || idx.date >= 0 || idx.day >= 0
  const start = hasHeader ? 1 : 0
  const mapped = hasHeader
    ? idx
    : first.length >= 5
      ? { date: -1, day: 0, month: 1, year: 2, payee: 3, amount: 4 }
      : { date: 0, day: -1, month: -1, year: -1, payee: 1, amount: 2 }

  const out: ChequeRow[] = []
  for (let i = start; i < rows.length; i++) {
    const row = rows[i] ?? []
    const date = dateFromCells(
      cell(row, mapped.date),
      cell(row, mapped.day),
      cell(row, mapped.month),
      cell(row, mapped.year),
    )
    const item = toRow(date, cell(row, mapped.payee), cell(row, mapped.amount))
    if (item) out.push(item)
  }
  return out
}

export async function parseExcelBuffer(data: ArrayBuffer): Promise<ChequeRow[]> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(data, { type: 'array', cellDates: true })
  const name = wb.SheetNames[0]
  if (!name) return []
  const sheet = wb.Sheets[name]
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: '',
  }) as unknown[][]
  return parseTableRows(rows)
}

/**
 * Text lines such as: 25/10/2026：抬頭：1234.50
 * Also accepts half-width colons, commas, or tabs.
 */
export function parseText(text: string): ChequeRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))

  const tableLike = lines.map((line) =>
    line.includes('\t') ? line.split('\t') : line.includes(',') && !line.includes('：') && !line.includes(':')
      ? line.split(',')
      : null,
  )
  if (tableLike.length && tableLike.every((r) => r && r.length >= 3)) {
    return parseTableRows(tableLike as unknown[][])
  }

  const out: ChequeRow[] = []
  for (const line of lines) {
    const normalized = line.replace(/[：:]/g, '：')
    const parts = normalized.split('：').map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 3) {
      const date = parseDateInput(parts[0])
      const amountPart = parts[parts.length - 1]
      const payee = parts.slice(1, -1).join('：')
      const item = toRow(date, payee, amountPart)
      if (item) out.push(item)
      continue
    }
    const loose = line.match(/^(\S+?)[\s,;]+(.+?)[\s,;]+(\$?HK\$?[\d,]+(?:\.\d+)?)$/i)
    if (loose) {
      const item = toRow(parseDateInput(loose[1]), loose[2], loose[3])
      if (item) out.push(item)
    }
  }
  return out
}

export function summarizeAmount(rows: ChequeRow[]): number {
  return rows.reduce((sum, row) => sum + (parseAmount(row.amount) ?? 0), 0)
}
