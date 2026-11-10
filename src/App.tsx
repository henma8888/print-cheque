import { useEffect, useMemo, useState } from 'react'
import AlignPanel from './components/AlignPanel'
import ChequeTable from './components/ChequeTable'
import ImportTextDialog from './components/ImportTextDialog'
import PrintPages from './components/PrintPages'
import { parseAmount } from './lib/amount'
import { newRow, parseExcelBuffer, parseText } from './lib/importData'
import { loadLayout, saveLayout } from './lib/storage'
import type { ChequeRow, LayoutSettings } from './lib/types'

type Tab = 'cheques' | 'align'

export default function App() {
  const [tab, setTab] = useState<Tab>('cheques')
  const [rows, setRows] = useState<ChequeRow[]>(() => [newRow()])
  const [layout, setLayout] = useState<LayoutSettings>(() => loadLayout())
  const [textOpen, setTextOpen] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => saveLayout(layout), 200)
    return () => window.clearTimeout(timer)
  }, [layout])

  const readyCount = useMemo(
    () => rows.filter((r) => r.payee || r.amount || r.day || r.month || r.year).length,
    [rows],
  )

  const addRow = () => setRows((current) => [...current, newRow()])

  const mergeImported = (incoming: ChequeRow[]) => {
    if (!incoming.length) {
      setStatus('檔案入面搵唔到支票資料。')
      return
    }
    setRows((current) => {
      const onlyBlank =
        current.length === 1 &&
        !current[0].payee &&
        !current[0].amount &&
        !current[0].day &&
        !current[0].month &&
        !current[0].year
      return onlyBlank ? incoming : [...current, ...incoming]
    })
    setStatus(`已加入 ${incoming.length} 張。`)
    setTab('cheques')
  }

  const onExcel = async (file: File | undefined) => {
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      mergeImported(await parseExcelBuffer(buffer))
    } catch {
      setStatus('Excel 讀唔到，請確認欄位係「日期、抬頭、銀碼」或「日、月、年、抬頭、銀碼」。')
    }
  }

  const onPrint = () => {
    const invalid = rows.filter((r) => r.amount && parseAmount(r.amount) == null)
    if (invalid.length) {
      setStatus('有銀碼格式唔啱，請檢查後再列印。')
      return
    }
    window.print()
  }

  const sample = rows.find((r) => r.payee || r.amount) ?? rows[0]

  return (
    <>
      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <h1>開支票</h1>
            <p>填日期、抬頭、銀碼，中文銀碼會自動出。一次過列印多張。</p>
          </div>
        </header>

        <nav className="tabs" aria-label="頁面">
          <button type="button" aria-selected={tab === 'cheques'} onClick={() => setTab('cheques')}>
            支票
          </button>
          <button type="button" aria-selected={tab === 'align'} onClick={() => setTab('align')}>
            對位
          </button>
        </nav>

        {tab === 'cheques' ? (
          <section>
            <div className="toolbar">
              <label className="btn">
                匯入 Excel
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  hidden
                  onChange={(e) => {
                    void onExcel(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              <button type="button" className="btn" onClick={() => setTextOpen(true)}>
                匯入文字
              </button>
              <button type="button" className="btn" onClick={addRow}>
                加一張
              </button>
            </div>

            <p className="hint" style={{ marginTop: 0, marginBottom: 10 }}>
              日期只需打數字，唔使斜線，印出嚟會加喺日、月、年中間。Excel 欄位可以係「日期、抬頭、銀碼」或「日、月、年、抬頭、銀碼」。文字每行例如 25/10/2026：抬頭：1234.50。
            </p>

            <ChequeTable rows={rows} onChange={setRows} />
            {status ? <p className="status">{status}</p> : null}

            <button type="button" className="btn-print" onClick={onPrint} disabled={readyCount === 0}>
              列印
            </button>
            <p className="print-tip">
              列印時選 A5 橫向（或信封），實際大小、邊界設為無，關掉頁首頁尾。支票放喺紙嘅右邊。
            </p>
          </section>
        ) : (
          <section>
            <AlignPanel layout={layout} onChange={setLayout} sample={sample} />
          </section>
        )}
      </div>

      <PrintPages rows={rows} layout={layout} />
      <ImportTextDialog
        open={textOpen}
        onClose={() => setTextOpen(false)}
        onImport={(text) => {
          mergeImported(parseText(text))
          setTextOpen(false)
        }}
      />
    </>
  )
}
