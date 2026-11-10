import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onImport: (text: string) => void
}

export default function ImportTextDialog({ open, onClose, onImport }: Props) {
  const [text, setText] = useState('')
  if (!open) return null

  const submit = () => {
    onImport(text)
    setText('')
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-labelledby="import-text-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="import-text-title">匯入文字</h2>
        <p>每行一張，例如：25/10/2026：抬頭：1234.50</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'25/10/2026：陳大文：1234.50\n26/10/2026：李小姐：500'}
          autoFocus
        />
        <div className="dialog-actions">
          <label className="btn">
            選文字檔
            <input
              type="file"
              accept=".txt,text/plain"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (file) setText(await file.text())
                e.target.value = ''
              }}
            />
          </label>
          <span style={{ flex: 1 }} />
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!text.trim()}>
            匯入
          </button>
        </div>
      </div>
    </div>
  )
}
