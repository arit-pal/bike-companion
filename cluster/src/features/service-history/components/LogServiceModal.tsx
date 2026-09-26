import { useState } from 'react'
import { recordsApi } from '@/features/service-history/api/records'

type LogServiceModalProps = {
  bikeId: string
  currentMileage: number
  intervalId: string
  intervalName: string
  onClose: () => void
  onLogged: () => void
}

const inputCls =
  'w-full h-10 px-3 bg-surface-container text-on-surface rounded border border-surface-container-highest focus:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-outline-variant/60'

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function LogServiceModal({ bikeId, currentMileage, intervalId, intervalName, onClose, onLogged }: LogServiceModalProps) {
  const [date, setDate] = useState(todayISO())
  const [mileage, setMileage] = useState(String(currentMileage))
  const [cost, setCost] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const miles = Number(mileage.replace(/,/g, ''))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Pick a valid date')
      return
    }
    if (!Number.isFinite(miles) || miles < 0) {
      setError('Enter a valid mileage')
      return
    }
    const costNum = cost.trim() === '' ? undefined : Number(cost)
    if (costNum !== undefined && (!Number.isFinite(costNum) || costNum < 0)) {
      setError('Cost must be ≥ 0')
      return
    }
    setSaving(true)
    try {
      await recordsApi.log(bikeId, {
        service_interval_id: intervalId,
        date_performed: date,
        mileage_at_service: miles,
        ...(costNum !== undefined ? { cost: costNum } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })
      onLogged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logging failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Log ${intervalName}`}
        className="w-full max-w-md bg-surface-container-low border border-surface-container-highest rounded-xl p-4 sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-label-xs text-label-xs tracking-[0.14em] uppercase text-primary">LOG SERVICE</div>
            <h2 className="mt-0.5 font-headline-sm text-headline-sm font-bold uppercase tracking-tight">{intervalName}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 inline-flex items-center justify-center rounded border border-surface-container-highest text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Date</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={`${inputCls} mt-1`} />
          </label>
          <label className="block">
            <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Mileage (KM)</span>
            <input
              value={mileage}
              onChange={(e) => setMileage(e.target.value.replace(/[^0-9,]/g, ''))}
              inputMode="numeric"
              className={`${inputCls} mt-1 font-mono tabular-nums`}
            />
          </label>
          <label className="block col-span-2">
            <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Cost (optional)</span>
            <input
              value={cost}
              onChange={(e) => setCost(e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
              placeholder="450"
              className={`${inputCls} mt-1 font-mono tabular-nums`}
            />
          </label>
          <label className="block col-span-2">
            <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Shell AX7, filter changed…"
              className="w-full px-3 py-2 bg-surface-container text-on-surface rounded border border-surface-container-highest focus:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-outline-variant/60 resize-none mt-1"
            />
          </label>
          {error && (
            <div role="alert" className="col-span-2 text-error text-label-md bg-error-container/20 border border-error/20 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded border border-surface-container-highest text-on-surface-variant hover:text-on-surface font-label-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-4 rounded bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {saving ? <span className="material-symbols-outlined motion-safe:animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">check</span>}
              {saving ? 'Saving…' : 'Mark done'}
            </button>
          </div>
        </form>
        <p className="mt-3 font-label-xs text-label-xs text-on-surface-variant">Logging resets this interval and rolls the odometer forward if higher.</p>
      </div>
    </div>
  )
}
