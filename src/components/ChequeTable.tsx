import DateInput from './DateInput'
import { chineseFromInput } from '../lib/amount'
import type { ChequeRow } from '../lib/types'

interface Props {
  rows: ChequeRow[]
  onChange: (rows: ChequeRow[]) => void
}

export default function ChequeTable({ rows, onChange }: Props) {
  const patch = (id: string, update: Partial<ChequeRow> & { amount?: string; chinese?: string }) => {
    onChange(
      rows.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...update }
        if (update.amount !== undefined) {
          next.chinese = chineseFromInput(update.amount)
          next.chineseManual = false
        } else if (update.chinese !== undefined) {
          next.chineseManual = true
        }
        return next
      }),
    )
  }

  const remove = (id: string) => {
    if (rows.length === 1) {
      const blank = { ...rows[0], day: '', month: '', year: '', payee: '', amount: '', chinese: '', chineseManual: false }
      onChange([blank])
      return
    }
    onChange(rows.filter((row) => row.id !== id))
  }

  return (
    <div className="card table-wrap">
      <table className="cheque-table">
        <thead>
          <tr>
            <th className="col-date">日期</th>
            <th>抬頭</th>
            <th className="col-amount">銀碼</th>
            <th className="col-chinese">中文銀碼</th>
            <th className="col-del">刪除</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id}>
              <td>
                <DateInput
                  date={row}
                  ariaLabel={`第${index + 1}張日期`}
                  onChange={(d) => patch(row.id, d)}
                />
              </td>
              <td>
                <input
                  type="text"
                  aria-label={`第${index + 1}張抬頭`}
                  placeholder="收款人"
                  value={row.payee}
                  onChange={(e) => patch(row.id, { payee: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`第${index + 1}張銀碼`}
                  placeholder="1234.50"
                  value={row.amount}
                  onChange={(e) => patch(row.id, { amount: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="text"
                  aria-label={`第${index + 1}張中文銀碼`}
                  placeholder="自動填寫，可改"
                  value={row.chinese}
                  onChange={(e) => patch(row.id, { chinese: e.target.value })}
                />
              </td>
              <td className="col-del">
                <button type="button" className="btn-danger" onClick={() => remove(row.id)}>
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
