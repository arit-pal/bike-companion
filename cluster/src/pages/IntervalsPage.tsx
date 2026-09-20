import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '@/api/constants'
import { authApi } from '@/features/auth/api/auth'
import { intervalsApi } from '@/features/service-intervals/api/intervals'
import { INTERVAL_PRESETS, type ServiceInterval } from '@/features/service-intervals/types'

type Bike = {
  id: string
  make: string
  model: string
  year: number
  current_mileage: number
}

type MeResponse = {
  user: { id: string; email: string }
  bike: Bike | null
}

const inputCls =
  'w-full h-10 px-3 bg-surface-container text-on-surface rounded border border-surface-container-highest focus:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-outline-variant/60'

function isAuthError(err: unknown): boolean {
  const status = (err as { status?: number })?.status
  return status === 401
}

export function IntervalsPage() {
  const navigate = useNavigate()
  const [bike, setBike] = useState<Bike | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [intervals, setIntervals] = useState<ServiceInterval[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addMiles, setAddMiles] = useState('')
  const [addDays, setAddDays] = useState('')
  const [addLastDone, setAddLastDone] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit + delete
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMiles, setEditMiles] = useState('')
  const [editDays, setEditDays] = useState('')
  const [editLastDone, setEditLastDone] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)
  const [presetAdding, setPresetAdding] = useState<string | null>(null)

  const handleAuthFail = useCallback(() => {
    authApi.logout()
    navigate('/login', { replace: true })
  }, [navigate])

  const flash = (kind: 'ok' | 'err', text: string) => {
    setBanner({ kind, text })
    window.setTimeout(() => setBanner(null), 3500)
  }

  useEffect(() => {
    let cancelled = false
    async function bootstrap() {
      const token = authApi.getToken()
      if (!token) {
        navigate('/login', { replace: true })
        return
      }
      try {
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (meRes.status === 401) {
          handleAuthFail()
          return
        }
        if (!meRes.ok) throw new Error('Failed to load garage')
        const me = (await meRes.json()) as MeResponse
        if (cancelled) return
        if (!me.bike) {
          setLoadError('No bike found — register a bike first.')
          return
        }
        setBike(me.bike)
        setUserEmail(me.user.email)
        setAddLastDone(String(me.bike.current_mileage))
        const list = await intervalsApi.list(me.bike.id)
        if (!cancelled) setIntervals(list)
      } catch (err) {
        if (cancelled) return
        if (isAuthError(err)) {
          handleAuthFail()
          return
        }
        setLoadError(err instanceof Error ? err.message : 'Failed to load intervals')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [navigate, handleAuthFail])

  const refresh = async (bikeId: string) => {
    const list = await intervalsApi.list(bikeId)
    setIntervals(list)
  }

  const handlePresetAdd = async (presetName: string) => {
    if (!bike) return
    const preset = INTERVAL_PRESETS.find((p) => p.name === presetName)
    if (!preset) return
    setPresetAdding(presetName)
    try {
      await intervalsApi.create(bike.id, {
        name: preset.name,
        interval_miles: preset.interval_miles,
        ...(preset.interval_days ? { interval_days: preset.interval_days } : {}),
        last_done_mileage: bike.current_mileage,
      })
      await refresh(bike.id)
      flash('ok', `${preset.name} added`)
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthFail()
        return
      }
      flash('err', err instanceof Error ? err.message : 'Add failed')
    } finally {
      setPresetAdding(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bike) return
    const miles = Number(addMiles.replace(/,/g, ''))
    if (!addName.trim()) {
      flash('err', 'Give the interval a name')
      return
    }
    if (!Number.isFinite(miles) || miles <= 0) {
      flash('err', 'Interval must be > 0 KM')
      return
    }
    const days = addDays.trim() === '' ? undefined : Number(addDays)
    if (days !== undefined && (!Number.isFinite(days) || days <= 0)) {
      flash('err', 'Days must be > 0 or empty')
      return
    }
    const lastDone = addLastDone.trim() === '' ? 0 : Number(addLastDone.replace(/,/g, ''))
    if (!Number.isFinite(lastDone) || lastDone < 0) {
      flash('err', 'Last-done mileage must be ≥ 0')
      return
    }
    setAdding(true)
    try {
      await intervalsApi.create(bike.id, {
        name: addName.trim(),
        interval_miles: miles,
        ...(days !== undefined ? { interval_days: days } : {}),
        last_done_mileage: lastDone,
      })
      await refresh(bike.id)
      setAddName('')
      setAddMiles('')
      setAddDays('')
      setShowAdd(false)
      flash('ok', 'Interval added')
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthFail()
        return
      }
      flash('err', err instanceof Error ? err.message : 'Add failed')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (iv: ServiceInterval) => {
    setEditingId(iv.id)
    setEditMiles(String(iv.interval_miles))
    setEditDays(iv.interval_days ? String(iv.interval_days) : '')
    setEditLastDone(String(iv.last_done_mileage))
    setConfirmDeleteId(null)
  }

  const handleSaveEdit = async (iv: ServiceInterval) => {
    if (!bike) return
    const miles = Number(editMiles.replace(/,/g, ''))
    if (!Number.isFinite(miles) || miles <= 0) {
      flash('err', 'Interval must be > 0 KM')
      return
    }
    const days = editDays.trim() === '' ? undefined : Number(editDays)
    if (days !== undefined && (!Number.isFinite(days) || days <= 0)) {
      flash('err', 'Days must be > 0 or empty')
      return
    }
    const lastDone = editLastDone.trim() === '' ? undefined : Number(editLastDone.replace(/,/g, ''))
    if (lastDone !== undefined && (!Number.isFinite(lastDone) || lastDone < 0)) {
      flash('err', 'Last-done mileage must be ≥ 0')
      return
    }
    setSaving(true)
    try {
      const updated = await intervalsApi.update(bike.id, iv.id, {
        interval_miles: miles,
        ...(days !== undefined ? { interval_days: days } : {}),
        ...(lastDone !== undefined ? { last_done_mileage: lastDone } : {}),
      })
      setIntervals((prev) => prev.map((x) => (x.id === iv.id ? updated : x)))
      setEditingId(null)
      flash('ok', `${iv.name} updated`)
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthFail()
        return
      }
      flash('err', err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (iv: ServiceInterval) => {
    if (!bike) return
    if (confirmDeleteId !== iv.id) {
      setConfirmDeleteId(iv.id)
      return
    }
    setRemoving(true)
    try {
      await intervalsApi.remove(bike.id, iv.id)
      setIntervals((prev) => prev.filter((x) => x.id !== iv.id))
      setConfirmDeleteId(null)
      if (editingId === iv.id) setEditingId(null)
      flash('ok', `${iv.name} deleted`)
    } catch (err) {
      if (isAuthError(err)) {
        handleAuthFail()
        return
      }
      flash('err', err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setRemoving(false)
    }
  }

  const addedNames = new Set(intervals.map((i) => i.name.toLowerCase()))

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined motion-safe:animate-spin">sync</span>
          <span className="font-mono text-[11px] tracking-widest uppercase">Loading intervals…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md px-gutter-lg py-space-sm flex items-center justify-between border-b border-surface-container-highest">
        <Link to="/dashboard" className="flex items-center gap-space-sm">
          <img src="/stator-logo.png" alt="Stator" width={32} height={32} className="h-8 w-8 object-contain rounded-md" />
          <span className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight">STATOR</span>
          <span className="hidden sm:inline-flex font-mono text-[10px] tracking-[0.12em] uppercase bg-surface-container border border-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full">INTERVALS</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-mono text-[11px] tracking-widest uppercase text-on-surface-variant truncate max-w-[180px]">{userEmail}</span>
          <Link
            to="/dashboard"
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded border border-surface-container-highest bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span> Garage
          </Link>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1160px] px-gutter-lg py-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-label-xs text-label-xs tracking-[0.14em] uppercase text-primary">GARAGE // INTERVALS</div>
            <h1 className="mt-1 font-headline-lg text-headline-lg font-bold uppercase tracking-tight">
              {bike ? `${bike.make} ${bike.model}` : 'Service intervals'}
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {bike ? `Odo ${bike.current_mileage.toLocaleString()} KM — ` : ''}configure what gets tracked and how often (KM).
            </p>
          </div>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="h-10 px-4 rounded bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">{showAdd ? 'close' : 'add'}</span>
            {showAdd ? 'Cancel' : 'Custom interval'}
          </button>
        </div>

        {banner && (
          <div
            role={banner.kind === 'err' ? 'alert' : 'status'}
            className={`mt-4 rounded px-3 py-2 text-label-md border ${banner.kind === 'err' ? 'text-error bg-error-container/20 border-error/20' : 'text-secondary bg-secondary/10 border-secondary/20'}`}
          >
            {banner.text}
          </div>
        )}
        {loadError && (
          <div role="alert" className="mt-4 rounded px-3 py-2 text-label-md text-error bg-error-container/20 border border-error/20">
            {loadError}
          </div>
        )}

        {/* Presets */}
        <section className="mt-6 bg-surface-container-low border border-surface-container-highest rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight">Quick-add presets</h2>
            <span className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">COMMUTER // KM</span>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {INTERVAL_PRESETS.map((p) => {
              const added = addedNames.has(p.name.toLowerCase())
              const busy = presetAdding === p.name
              return (
                <div key={p.name} className="rounded-lg bg-surface-container border border-surface-container-highest/60 px-3 py-2.5 flex items-center gap-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-label-md text-label-md font-medium truncate">{p.name}</div>
                    <div className="font-mono text-[10px] tracking-wider text-on-surface-variant uppercase">
                      every {p.interval_miles.toLocaleString()} KM{p.interval_days ? ` · ${p.interval_days}d` : ''} — {p.blurb}
                    </div>
                  </div>
                  {added ? (
                    <span className="shrink-0 inline-flex items-center gap-1 font-mono text-[10px] tracking-widest uppercase px-2 py-1 rounded bg-secondary/15 border border-secondary/30 text-secondary">
                      <span className="material-symbols-outlined text-[14px]">check</span> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePresetAdd(p.name)}
                      disabled={busy}
                      className="shrink-0 h-8 px-3 rounded bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed disabled:opacity-60 inline-flex items-center gap-1"
                    >
                      {busy ? <span className="material-symbols-outlined motion-safe:animate-spin text-[14px]">sync</span> : <span className="material-symbols-outlined text-[14px]">add</span>}
                      {busy ? 'Adding' : 'Add'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Custom add */}
        {showAdd && (
          <section className="mt-4 bg-surface-container-low border border-surface-container-highest rounded-xl p-4 sm:p-5">
            <h2 className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight">Custom interval</h2>
            <form onSubmit={handleAdd} className="mt-4 grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Name</span>
                <input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Sprocket check" maxLength={100} className={`${inputCls} mt-1`} />
              </label>
              <label className="block">
                <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Every (KM)</span>
                <input value={addMiles} onChange={(e) => setAddMiles(e.target.value.replace(/[^0-9,]/g, ''))} inputMode="numeric" placeholder="6,000" className={`${inputCls} mt-1 font-mono tabular-nums`} />
              </label>
              <label className="block">
                <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Every (days, optional)</span>
                <input value={addDays} onChange={(e) => setAddDays(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="180" className={`${inputCls} mt-1 font-mono tabular-nums`} />
              </label>
              <label className="block">
                <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Last done at (KM)</span>
                <input value={addLastDone} onChange={(e) => setAddLastDone(e.target.value.replace(/[^0-9,]/g, ''))} inputMode="numeric" placeholder="12,000" className={`${inputCls} mt-1 font-mono tabular-nums`} />
              </label>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button type="submit" disabled={adding} className="h-10 px-4 rounded bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed disabled:opacity-60 inline-flex items-center gap-1.5">
                  {adding ? <span className="material-symbols-outlined motion-safe:animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">add</span>}
                  {adding ? 'Adding…' : 'Add interval'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* List */}
        <section className="mt-4 bg-surface-container-low border border-surface-container-highest rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight">Your intervals ({intervals.length})</h2>
            <span className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">LIVE // DB</span>
          </div>
          {intervals.length === 0 ? (
            <div className="mt-4 rounded-lg bg-surface-container border border-surface-container-highest/60 p-6 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[28px]">build</span>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">Nothing tracked yet — quick-add a preset above or create a custom interval.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {intervals.map((iv) => {
                const editing = editingId === iv.id
                const confirming = confirmDeleteId === iv.id
                return (
                  <div key={iv.id} className="rounded-lg bg-surface-container border border-surface-container-highest/60 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[16px] shrink-0 text-primary">schedule</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-label-md text-label-md font-medium truncate">{iv.name}</div>
                        <div className="font-mono text-[10px] tracking-wider text-on-surface-variant uppercase">
                          every {iv.interval_miles.toLocaleString()} KM{iv.interval_days ? ` · ${iv.interval_days}d` : ''} · last {iv.last_done_mileage.toLocaleString()} KM
                        </div>
                      </div>
                      {!editing && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => startEdit(iv)} title="Edit" className="h-8 w-8 inline-flex items-center justify-center rounded border border-surface-container-highest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(iv)}
                            disabled={removing && confirming}
                            title={confirming ? 'Click again to confirm' : 'Delete'}
                            className={`h-8 px-2.5 inline-flex items-center gap-1 rounded border font-label-md ${confirming ? 'border-error/40 bg-error-container/20 text-error' : 'border-surface-container-highest text-on-surface-variant hover:text-error'}`}
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            {confirming && <span className="font-mono text-[10px] uppercase">{removing ? '…' : 'Sure?'}</span>}
                          </button>
                        </div>
                      )}
                    </div>
                    {editing && (
                      <div className="mt-3 grid sm:grid-cols-3 gap-2 border-t border-surface-container-highest/60 pt-3">
                        <label className="block">
                          <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Every (KM)</span>
                          <input value={editMiles} onChange={(e) => setEditMiles(e.target.value.replace(/[^0-9,]/g, ''))} inputMode="numeric" className={`${inputCls} mt-1 font-mono tabular-nums`} />
                        </label>
                        <label className="block">
                          <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Every (days)</span>
                          <input value={editDays} onChange={(e) => setEditDays(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="—" className={`${inputCls} mt-1 font-mono tabular-nums`} />
                        </label>
                        <label className="block">
                          <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Last done (KM)</span>
                          <input value={editLastDone} onChange={(e) => setEditLastDone(e.target.value.replace(/[^0-9,]/g, ''))} inputMode="numeric" className={`${inputCls} mt-1 font-mono tabular-nums`} />
                        </label>
                        <div className="sm:col-span-3 flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="h-9 px-3 rounded border border-surface-container-highest text-on-surface-variant hover:text-on-surface font-label-md">
                            Cancel
                          </button>
                          <button onClick={() => handleSaveEdit(iv)} disabled={saving} className="h-9 px-4 rounded bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed disabled:opacity-60 inline-flex items-center gap-1.5">
                            {saving && <span className="material-symbols-outlined motion-safe:animate-spin text-[14px]">sync</span>}
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="w-full py-space-sm px-gutter-lg flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant border-t border-surface-container-highest/40">
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">MACHINE & MOTOR // TWO WHEELS ONLY</span>
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">PRECISION // ASPHALT & STEEL</span>
      </footer>
    </div>
  )
}
