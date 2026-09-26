import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '@/api/constants'
import { authApi } from '@/features/auth/api/auth'
import { intervalsApi } from '@/features/service-intervals/api/intervals'
import type { ServiceInterval } from '@/features/service-intervals/types'
import { recordsApi } from '@/features/service-history/api/records'
import type { ServiceRecord } from '@/features/service-history/types'

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

type SortKey = 'date' | 'mileage' | 'cost'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function HistoryPage() {
  const navigate = useNavigate()
  const [bike, setBike] = useState<Bike | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [intervals, setIntervals] = useState<ServiceInterval[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filterId, setFilterId] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filtering, setFiltering] = useState(false)

  const handleAuthFail = useCallback(() => {
    authApi.logout()
    navigate('/login', { replace: true })
  }, [navigate])

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
        const [recs, ivs] = await Promise.all([recordsApi.list(me.bike.id), intervalsApi.list(me.bike.id)])
        if (!cancelled) {
          setRecords(recs)
          setIntervals(ivs)
        }
      } catch (err) {
        if (cancelled) return
        if ((err as { status?: number })?.status === 401) {
          handleAuthFail()
          return
        }
        setLoadError(err instanceof Error ? err.message : 'Failed to load history')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      cancelled = true
    }
  }, [navigate, handleAuthFail])

  const handleFilter = async (intervalId: string) => {
    if (!bike) return
    setFilterId(intervalId)
    setFiltering(true)
    try {
      if (intervalId === '__oneoff') {
        const recs = await recordsApi.list(bike.id)
        setRecords(recs.filter((r) => !r.service_interval_id))
      } else {
        const recs = await recordsApi.list(bike.id, intervalId || undefined)
        setRecords(recs)
      }
    } catch (err) {
      if ((err as { status?: number })?.status === 401) {
        handleAuthFail()
        return
      }
      setLoadError(err instanceof Error ? err.message : 'Filter failed')
    } finally {
      setFiltering(false)
    }
  }

  const names = useMemo(() => {
    const m: Record<string, string> = {}
    for (const iv of intervals) m[iv.id] = iv.name
    return m
  }, [intervals])

  const visible = useMemo(() => {
    const arr = [...records]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (sortKey === 'date') return dir * (a.date_performed.localeCompare(b.date_performed) || a.created_at.localeCompare(b.created_at))
      if (sortKey === 'mileage') return dir * (a.mileage_at_service - b.mileage_at_service)
      return dir * ((a.cost ?? -1) - (b.cost ?? -1))
    })
    return arr
  }, [records, sortKey, sortDir])

  const totalCost = useMemo(() => visible.reduce((s, r) => s + (r.cost ?? 0), 0), [visible])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sortTh = (label: string, key: SortKey) => (
    <button
      onClick={() => toggleSort(key)}
      className="inline-flex items-center gap-1 font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
    >
      {label}
      <span className="material-symbols-outlined text-[14px]">{sortKey === key ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}</span>
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined motion-safe:animate-spin">sync</span>
          <span className="font-mono text-[11px] tracking-widest uppercase">Loading history…</span>
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
          <span className="hidden sm:inline-flex font-mono text-[10px] tracking-[0.12em] uppercase bg-surface-container border border-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full">HISTORY</span>
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
            <div className="font-label-xs text-label-xs tracking-[0.14em] uppercase text-primary">GARAGE // HISTORY</div>
            <h1 className="mt-1 font-headline-lg text-headline-lg font-bold uppercase tracking-tight">Service history</h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {bike ? `${bike.make} ${bike.model} — ` : ''}{visible.length} record{visible.length === 1 ? '' : 's'}
              {totalCost > 0 && <span> · ₹{totalCost.toLocaleString('en-IN')} total</span>}
            </p>
          </div>
          <label className="flex items-center gap-2">
            <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Filter</span>
            <select
              value={filterId}
              onChange={(e) => handleFilter(e.target.value)}
              disabled={filtering}
              className="h-10 px-3 bg-surface-container text-on-surface rounded border border-surface-container-highest focus:outline-none focus-visible:ring-1 focus-visible:ring-primary font-label-md"
            >
              <option value="">All types</option>
              {intervals.map((iv) => (
                <option key={iv.id} value={iv.id}>{iv.name}</option>
              ))}
              <option value="__oneoff">One-off (no interval)</option>
            </select>
          </label>
        </div>

        {loadError && (
          <div role="alert" className="mt-4 rounded px-3 py-2 text-label-md text-error bg-error-container/20 border border-error/20">
            {loadError}
          </div>
        )}

        <section className="mt-6 bg-surface-container-low border border-surface-container-highest rounded-xl p-4 sm:p-5">
          {visible.length === 0 ? (
            <div className="rounded-lg bg-surface-container border border-surface-container-highest/60 p-6 text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-[28px]">history</span>
              <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                {filterId ? 'No records for this filter — try another type.' : 'No services logged yet — hit Done on the dashboard after your next job.'}
              </p>
              {!filterId && (
                <Link to="/dashboard" className="mt-3 h-9 inline-flex items-center gap-1.5 px-3 rounded bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed">
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to garage
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-surface-container-highest text-left">
                    <th className="py-2 pr-3">{sortTh('Date', 'date')}</th>
                    <th className="py-2 pr-3 font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Service</th>
                    <th className="py-2 pr-3 text-right">{sortTh('Mileage', 'mileage')}</th>
                    <th className="py-2 pr-3 text-right">{sortTh('Cost', 'cost')}</th>
                    <th className="py-2 font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id} className="border-b border-surface-container-highest/40 last:border-0">
                      <td className="py-2.5 pr-3 font-mono text-[12px] tabular-nums whitespace-nowrap">{formatDate(r.date_performed)}</td>
                      <td className="py-2.5 pr-3 font-label-md text-label-md font-medium">
                        {r.service_interval_id ? (names[r.service_interval_id] ?? 'Interval') : <span className="text-on-surface-variant">One-off</span>}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-[12px] tabular-nums text-right whitespace-nowrap">{r.mileage_at_service.toLocaleString()} KM</td>
                      <td className="py-2.5 pr-3 font-mono text-[12px] tabular-nums text-right whitespace-nowrap">{r.cost != null ? `₹${Number(r.cost).toLocaleString('en-IN')}` : '—'}</td>
                      <td className="py-2.5 font-body-sm text-body-sm text-on-surface-variant max-w-[280px] truncate" title={r.notes ?? ''}>{r.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
