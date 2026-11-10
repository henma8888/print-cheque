import { formatNumericAmount, parseAmount } from '../lib/amount'
import { chequeSizeMm } from '../lib/layout'
import type { ChequeRow, LayoutSettings } from '../lib/types'

interface Props {
  rows: ChequeRow[]
  layout: LayoutSettings
}

function DatePrint({ row, layout }: { row: ChequeRow; layout: LayoutSettings }) {
  const slashStyle = { margin: `0 ${Math.max(0, layout.gapDayMonthMm / 4)}mm` }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
      <span style={{ marginLeft: `${layout.gapBeforeDayMm}mm` }}>{row.day}</span>
      <span style={slashStyle}>/</span>
      <span>{row.month}</span>
      <span style={{ margin: `0 ${layout.gapMonthYearMm / 4}mm` }}>/</span>
      <span style={{ minWidth: `${layout.yearWidthMm}mm` }}>{row.year}</span>
    </span>
  )
}

export default function PrintPages({ rows, layout }: Props) {
  const cheque = chequeSizeMm(layout)
  const printable = rows.filter((r) => r.payee || r.amount)

  return (
    <>
      <style>{`@media print { @page { size: ${layout.paperWidthMm}mm ${layout.paperHeightMm}mm; margin: 0; } }`}</style>
      <div className="print-root" aria-hidden="true">
        {printable.map((row) => {
          const amount = parseAmount(row.amount)
          const numberText = amount != null ? formatNumericAmount(amount) : row.amount
          return (
            <section
              key={row.id}
              className="print-page"
              style={{
                width: `${layout.paperWidthMm}mm`,
                height: `${layout.paperHeightMm}mm`,
              }}
            >
              <div
                className="print-cheque"
                style={{
                  width: `${cheque.widthMm}mm`,
                  height: `${cheque.heightMm}mm`,
                  top: `${layout.marginTopMm}mm`,
                  left: `${layout.marginLeftMm}mm`,
                  right: 'auto',
                }}
              >
                <div
                  className="print-field"
                  style={{
                    left: `${layout.dateXmm}mm`,
                    top: `${layout.dateYmm}mm`,
                    height: `${layout.dateRowHeightMm}mm`,
                    fontSize: `${layout.fontSizePt}pt`,
                  }}
                >
                  <DatePrint row={row} layout={layout} />
                </div>
                <div
                  className="print-field"
                  style={{
                    left: `${layout.payeeXmm + layout.gapBeforePayeeMm}mm`,
                    top: `${layout.payeeYmm}mm`,
                    height: `${layout.payeeRowHeightMm}mm`,
                    width: `${Math.max(10, cheque.widthMm - layout.payeeXmm - layout.gapBeforePayeeMm - 6)}mm`,
                    fontSize: `${layout.fontSizePt}pt`,
                  }}
                >
                  {row.payee}
                </div>
                <div
                  className="print-field"
                  style={{
                    left: `${layout.chineseXmm + layout.gapBeforeChineseMm}mm`,
                    top: `${layout.chineseYmm}mm`,
                    height: `${layout.amountRowHeightMm}mm`,
                    width: `${layout.chineseWidthMm}mm`,
                    fontSize: `${layout.fontSizePt}pt`,
                  }}
                >
                  {row.chinese}
                </div>
                <div
                  className="print-field number"
                  style={{
                    left: `${layout.numberXmm}mm`,
                    top: `${layout.numberYmm}mm`,
                    height: `${layout.amountRowHeightMm}mm`,
                    width: `${layout.numberWidthMm}mm`,
                    fontSize: `${layout.fontSizePt}pt`,
                  }}
                >
                  {numberText}
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </>
  )
}
