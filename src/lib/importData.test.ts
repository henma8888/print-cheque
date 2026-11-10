import { describe, expect, it } from 'vitest'
import { parseTableRows, parseText } from './importData'

describe('parseText', () => {
  it('parses the documented line format', () => {
    const rows = parseText('25/10/2026：抬頭：1234.50')
    expect(rows).toHaveLength(1)
    expect(rows[0].day).toBe('25')
    expect(rows[0].month).toBe('10')
    expect(rows[0].year).toBe('2026')
    expect(rows[0].payee).toBe('抬頭')
    expect(rows[0].amount).toBe('1234.50')
    expect(rows[0].chinese).toBe('壹仟貳佰參拾肆元伍角正')
  })

  it('parses half-width colons and a real payee name', () => {
    const rows = parseText('25/10/2026:陳大文:HK$1,000')
    expect(rows).toHaveLength(1)
    expect(rows[0].payee).toBe('陳大文')
    expect(rows[0].amount).toBe('HK$1,000')
    expect(rows[0].chinese).toBe('壹仟元正')
  })

  it('parses multiple lines and ignores blanks', () => {
    const rows = parseText(`
25/10/2026：甲：10
26/10/2026：乙：20.5
`)
    expect(rows).toHaveLength(2)
    expect(rows[1].payee).toBe('乙')
    expect(rows[1].chinese).toBe('貳拾元伍角正')
  })
})

describe('parseTableRows', () => {
  it('reads 日期、抬頭、銀碼 headers', () => {
    const rows = parseTableRows([
      ['日期', '抬頭', '銀碼'],
      ['25/10/2026', '陳大文', '1234.50'],
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].payee).toBe('陳大文')
    expect(rows[0].day).toBe('25')
    expect(rows[0].chinese).toBe('壹仟貳佰參拾肆元伍角正')
  })

  it('reads 日、月、年、抬頭、銀碼 headers', () => {
    const rows = parseTableRows([
      ['日', '月', '年', '抬頭', '銀碼'],
      ['25', '10', '2026', '李小姐', '100'],
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      day: '25',
      month: '10',
      year: '2026',
      payee: '李小姐',
      amount: '100',
      chinese: '壹佰元正',
    })
  })
})
