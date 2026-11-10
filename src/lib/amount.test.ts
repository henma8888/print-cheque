import { describe, expect, it } from 'vitest'
import {
  amountToChinese,
  chineseFromInput,
  integerToChinese,
  parseAmount,
} from './amount'

describe('parseAmount', () => {
  it('parses plain numbers and rounds to cents', () => {
    expect(parseAmount('1234.50')).toBe(1234.5)
    expect(parseAmount('1234.5')).toBe(1234.5)
    expect(parseAmount('1.235')).toBe(1.24)
    expect(parseAmount('1.234')).toBe(1.23)
    expect(parseAmount('0')).toBe(0)
  })

  it('accepts $, HK$, commas and spaces', () => {
    expect(parseAmount('$1,234.50')).toBe(1234.5)
    expect(parseAmount('HK$1234.5')).toBe(1234.5)
    expect(parseAmount('HK$ 1,234.50')).toBe(1234.5)
    expect(parseAmount('hk$1,000')).toBe(1000)
    expect(parseAmount('港幣1,234.50')).toBe(1234.5)
  })

  it('rejects empty, negative or invalid values', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('   ')).toBeNull()
    expect(parseAmount('-1')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
    expect(parseAmount('12.34.56')).toBeNull()
  })
})

describe('integerToChinese', () => {
  it('converts sections with 零 in the right places', () => {
    expect(integerToChinese(0)).toBe('零')
    expect(integerToChinese(1)).toBe('壹')
    expect(integerToChinese(10)).toBe('壹拾')
    expect(integerToChinese(12)).toBe('壹拾貳')
    expect(integerToChinese(20)).toBe('貳拾')
    expect(integerToChinese(100)).toBe('壹佰')
    expect(integerToChinese(101)).toBe('壹佰零壹')
    expect(integerToChinese(110)).toBe('壹佰壹拾')
    expect(integerToChinese(1000)).toBe('壹仟')
    expect(integerToChinese(1001)).toBe('壹仟零壹')
    expect(integerToChinese(1010)).toBe('壹仟零壹拾')
    expect(integerToChinese(1100)).toBe('壹仟壹佰')
    expect(integerToChinese(1234)).toBe('壹仟貳佰參拾肆')
  })

  it('handles 萬 and 億', () => {
    expect(integerToChinese(10_000)).toBe('壹萬')
    expect(integerToChinese(10_001)).toBe('壹萬零壹')
    expect(integerToChinese(10_010)).toBe('壹萬零壹拾')
    expect(integerToChinese(10_100)).toBe('壹萬零壹佰')
    expect(integerToChinese(11_000)).toBe('壹萬壹仟')
    expect(integerToChinese(100_000)).toBe('壹拾萬')
    expect(integerToChinese(1_000_000)).toBe('壹佰萬')
    expect(integerToChinese(10_000_000)).toBe('壹仟萬')
    expect(integerToChinese(100_000_000)).toBe('壹億')
    expect(integerToChinese(100_000_001)).toBe('壹億零壹')
    expect(integerToChinese(123_456_789)).toBe(
      '壹億貳仟參佰肆拾伍萬陸仟柒佰捌拾玖',
    )
  })
})

describe('amountToChinese', () => {
  it('formats zero and whole dollars ending with 正', () => {
    expect(amountToChinese(0)).toBe('零元正')
    expect(amountToChinese(1)).toBe('壹元正')
    expect(amountToChinese(10)).toBe('壹拾元正')
    expect(amountToChinese(100)).toBe('壹佰元正')
    expect(amountToChinese(1000)).toBe('壹仟元正')
    expect(amountToChinese(10_000)).toBe('壹萬元正')
    expect(amountToChinese(100_000)).toBe('壹拾萬元正')
    expect(amountToChinese(1_000_000)).toBe('壹佰萬元正')
  })

  it('formats 角 and 分 and always ends with 正', () => {
    expect(amountToChinese(1234.5)).toBe('壹仟貳佰參拾肆元伍角正')
    expect(amountToChinese(1.05)).toBe('壹元零伍分正')
    expect(amountToChinese(1.5)).toBe('壹元伍角正')
    expect(amountToChinese(1.55)).toBe('壹元伍角伍分正')
    expect(amountToChinese(0.5)).toBe('伍角正')
    expect(amountToChinese(0.05)).toBe('伍分正')
    expect(amountToChinese(0.01)).toBe('壹分正')
    expect(amountToChinese(1000.05)).toBe('壹仟元零伍分正')
    expect(amountToChinese(1945.86)).toBe('壹仟玖佰肆拾伍元捌角陸分正')
  })

  it('chineseFromInput follows parse + convert', () => {
    expect(chineseFromInput('HK$1,234.50')).toBe('壹仟貳佰參拾肆元伍角正')
    expect(chineseFromInput('0')).toBe('零元正')
    expect(chineseFromInput('')).toBe('')
    expect(chineseFromInput('nope')).toBe('')
  })
})
