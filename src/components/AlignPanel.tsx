import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { formatNumericAmount, parseAmount } from '../lib/amount'
import { compressImage } from '../lib/image'
import {
  applyPaperAlign,
  applyPaperPreset,
  checkOverflow,
  chequeSizeMm,
  detectPaperAlign,
} from '../lib/layout'
import { downloadText, exportSettings, importSettings } from '../lib/storage'
import { PAPER_PRESETS, type ChequeRow, type LayoutSettings, type PaperPreset } from '../lib/types'

interface Props {
  layout: LayoutSettings
  onChange: (layout: LayoutSettings) => void
  sample: ChequeRow
}

type FieldKey = 'date' | 'payee' | 'chinese' | 'number'

const FIELD_POS: Record<FieldKey, { x: keyof LayoutSettings; y: keyof LayoutSettings }> = {
  date: { x: 'dateXmm', y: 'dateYmm' },
  payee: { x: 'payeeXmm', y: 'payeeYmm' },
  chinese: { x: 'chineseXmm', y: 'chineseYmm' },
  number: { x: 'numberXmm', y: 'numberYmm' },
}

function NumberField({
  label,
  value,
  onChange,
  step = 0.1,
  min,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  step?: number
  min?: number
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        step={step}
        min={min}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export default function AlignPanel({ layout, onChange, sample }: Props) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<FieldKey | null>(null)
  const [photoHint, setPhotoHint] = useState('')
  const overflow = checkOverflow(layout)
  const paperAlign = detectPaperAlign(layout)
  const cheque = chequeSizeMm(layout)

  const scale = useMemo(() => {
    const maxW = 640
    return Math.min(2.4, maxW / layout.paperWidthMm)
  }, [layout.paperWidthMm])

  const amount = parseAmount(sample.amount)
  const numberText = amount != null ? formatNumericAmount(amount) : sample.amount || '1,234.50'
  const dateText = [sample.day || '25', sample.month || '10', sample.year || '2026'].join(' / ')

  const startDrag = (key: FieldKey, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(key)
    const originX = event.clientX
    const originY = event.clientY
    const startX = Number(layout[FIELD_POS[key].x])
    const startY = Number(layout[FIELD_POS[key].y])

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - originX) / scale
      const dy = (ev.clientY - originY) / scale
      onChange({
        ...layout,
        [FIELD_POS[key].x]: Math.round((startX + dx) * 10) / 10,
        [FIELD_POS[key].y]: Math.round((startY + dy) * 10) / 10,
      })
    }
    const up = () => {
      setDragging(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const set = <K extends keyof LayoutSettings>(key: K, value: LayoutSettings[K]) => {
    onChange({ ...layout, [key]: value })
  }

  const onPhoto = async (file: File | undefined) => {
    if (!file) return
    try {
      const dataUrl = await compressImage(file)
      set('backgroundDataUrl', dataUrl)
      setPhotoHint('已加上底圖，只供對位，列印時唔會出。')
    } catch {
      setPhotoHint('相片讀唔到，請試過另一張。')
    }
  }

  const onImportSettings = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    onChange(importSettings(text))
    setPhotoHint('已讀取設定檔。')
  }

  return (
    <div className="align-grid">
      <div>
        <div className="preview-board" ref={boardRef}>
          <div
            className="preview-paper"
            style={{
              width: `${layout.paperWidthMm * scale}px`,
              height: `${layout.paperHeightMm * scale}px`,
            }}
          >
            <div
              className="preview-cheque"
              style={{
                width: `${cheque.widthMm * scale}px`,
                height: `${cheque.heightMm * scale}px`,
                top: `${layout.marginTopMm * scale}px`,
                left: `${layout.marginLeftMm * scale}px`,
                right: 'auto',
              }}
            >
              {layout.backgroundDataUrl ? (
                <img className="bg align-only" src={layout.backgroundDataUrl} alt="" />
              ) : null}
              <div className="grid-lines align-only" />
              <div
                className={`field field-date${dragging === 'date' ? ' dragging' : ''}`}
                style={{
                  left: `${layout.dateXmm * scale}px`,
                  top: `${layout.dateYmm * scale}px`,
                  height: `${layout.dateRowHeightMm * scale}px`,
                  fontSize: `${layout.fontSizePt * (scale * 0.3528)}px`,
                }}
                onPointerDown={(e) => startDrag('date', e)}
              >
                {dateText}
              </div>
              <div
                className={`field${dragging === 'payee' ? ' dragging' : ''}`}
                style={{
                  left: `${(layout.payeeXmm + layout.gapBeforePayeeMm) * scale}px`,
                  top: `${layout.payeeYmm * scale}px`,
                  height: `${layout.payeeRowHeightMm * scale}px`,
                  width: `${Math.max(40, cheque.widthMm - layout.payeeXmm - layout.gapBeforePayeeMm - 6) * scale}px`,
                  fontSize: `${layout.fontSizePt * (scale * 0.3528)}px`,
                }}
                onPointerDown={(e) => startDrag('payee', e)}
              >
                {sample.payee || '抬頭人'}
              </div>
              <div
                className={`field${dragging === 'chinese' ? ' dragging' : ''}`}
                style={{
                  left: `${(layout.chineseXmm + layout.gapBeforeChineseMm) * scale}px`,
                  top: `${layout.chineseYmm * scale}px`,
                  height: `${layout.amountRowHeightMm * scale}px`,
                  width: `${layout.chineseWidthMm * scale}px`,
                  fontSize: `${layout.fontSizePt * (scale * 0.3528)}px`,
                }}
                onPointerDown={(e) => startDrag('chinese', e)}
              >
                {sample.chinese || '壹仟貳佰參拾肆元伍角正'}
              </div>
              <div
                className={`field field-number${dragging === 'number' ? ' dragging' : ''}`}
                style={{
                  left: `${layout.numberXmm * scale}px`,
                  top: `${layout.numberYmm * scale}px`,
                  height: `${layout.amountRowHeightMm * scale}px`,
                  width: `${layout.numberWidthMm * scale}px`,
                  fontSize: `${layout.fontSizePt * (scale * 0.3528)}px`,
                }}
                onPointerDown={(e) => startDrag('number', e)}
                title="數字銀碼可獨立上下左右移動"
              >
                {numberText}
              </div>
            </div>
          </div>
        </div>
        <div className="paper-align" role="group" aria-label="列印範圍">
          <span className="paper-align-label">列印範圍</span>
          <div className="paper-align-group">
            {(
              [
                ['top', '置頂'],
                ['middle', '置中'],
                ['bottom', '置底'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="btn"
                aria-pressed={paperAlign.vertical === value}
                onClick={() => onChange(applyPaperAlign(layout, value, undefined))}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="paper-align-group">
            {(
              [
                ['left', '靠左'],
                ['right', '靠右'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="btn"
                aria-pressed={paperAlign.horizontal === value}
                onClick={() => onChange(applyPaperAlign(layout, undefined, value))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="hint">格線同底圖只係對位用，唔會印出。拖動欄位就可以校位置；數字銀碼可以單獨拉上拉下。上面掣係移動成個列印範圍喺紙上嘅位置。</p>
        {overflow.message ? <p className="warn">{overflow.message}</p> : null}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="settings">
          <h2>紙張同支票</h2>
          <div className="presets">
            {(Object.keys(PAPER_PRESETS) as PaperPreset[]).map((key) => (
              <button
                key={key}
                type="button"
                className="btn"
                aria-pressed={layout.paperPreset === key}
                onClick={() => onChange(applyPaperPreset(layout, key))}
              >
                {PAPER_PRESETS[key].label}
              </button>
            ))}
          </div>

          <div className="fields-form">
            <NumberField label="支票闊 cm" value={layout.chequeWidthCm} onChange={(n) => set('chequeWidthCm', n)} />
            <NumberField label="支票高 cm" value={layout.chequeHeightCm} onChange={(n) => set('chequeHeightCm', n)} />
            <NumberField label="上邊距 mm" value={layout.marginTopMm} onChange={(n) => set('marginTopMm', n)} />
            <NumberField label="右邊距 mm" value={layout.marginRightMm} onChange={(n) => set('marginRightMm', n)} />
            <NumberField label="左邊距 mm" value={layout.marginLeftMm} onChange={(n) => set('marginLeftMm', n)} />
            <NumberField label="字級 pt" value={layout.fontSizePt} onChange={(n) => set('fontSizePt', n)} step={0.5} />
          </div>

          <h2>欄寬同間距</h2>
          <div className="fields-form">
            <NumberField label="抬頭前距 mm" value={layout.gapBeforePayeeMm} onChange={(n) => set('gapBeforePayeeMm', n)} />
            <NumberField label="中文前距 mm" value={layout.gapBeforeChineseMm} onChange={(n) => set('gapBeforeChineseMm', n)} />
            <NumberField label="中文欄寬 mm" value={layout.chineseWidthMm} onChange={(n) => set('chineseWidthMm', n)} />
            <NumberField label="數字欄寬 mm" value={layout.numberWidthMm} onChange={(n) => set('numberWidthMm', n)} />
            <NumberField label="日前距 mm" value={layout.gapBeforeDayMm} onChange={(n) => set('gapBeforeDayMm', n)} />
            <NumberField label="日同月距 mm" value={layout.gapDayMonthMm} onChange={(n) => set('gapDayMonthMm', n)} />
            <NumberField label="月同年距 mm" value={layout.gapMonthYearMm} onChange={(n) => set('gapMonthYearMm', n)} />
            <NumberField label="年欄寬 mm" value={layout.yearWidthMm} onChange={(n) => set('yearWidthMm', n)} />
          </div>

          <h2>對位底圖</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            上傳成張支票相，再填實測闊同高。相只用來對位，唔會印出。
          </p>
          <div className="toolbar">
            <label className="btn">
              上傳支票相
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void onPhoto(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
            {layout.backgroundDataUrl ? (
              <button type="button" className="btn btn-ghost" onClick={() => set('backgroundDataUrl', '')}>
                清除底圖
              </button>
            ) : null}
          </div>

          <h2>設定</h2>
          <p className="hint" style={{ marginTop: 0 }}>
            對位會記喺呢部電腦。換第二部就匯出設定檔，再開讀取。
          </p>
          <div className="toolbar">
            <button
              type="button"
              className="btn"
              onClick={() => downloadText('cheque-layout.json', exportSettings(layout))}
            >
              匯出設定
            </button>
            <label className="btn">
              讀取設定
              <input
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  void onImportSettings(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          {photoHint ? <p className="hint">{photoHint}</p> : null}
        </div>
      </div>
    </div>
  )
}
