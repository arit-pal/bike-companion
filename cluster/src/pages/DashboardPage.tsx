import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/features/auth/api/auth'
import { API_BASE_URL } from '@/api/constants'

type Bike = {
  id: string
  make: string
  model: string
  year: number
  current_mileage: number
  category?: string
  vin?: string
  created_at: string
}

type MeResponse = {
  user: { id: string; email: string }
  bike: Bike | null
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mileageInput, setMileageInput] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [updateSuccess, setUpdateSuccess] = useState('')

  useEffect(() => {
    const token = authApi.getToken()
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false
    async function fetchMe() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || 'Failed to load garage')
        }
        const json = (await res.json()) as MeResponse
        if (!cancelled) {
          setData(json)
          if (json.bike) setMileageInput(String(json.bike.current_mileage))
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load')
          if ((err as Error).message.includes('invalid token') || (err as Error).message.includes('unauthorized')) {
            authApi.logout()
            navigate('/login', { replace: true })
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchMe()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const handleLogout = () => {
    authApi.logout()
    navigate('/login', { replace: true })
  }

  const handleUpdateMileage = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdateError('')
    setUpdateSuccess('')
    if (!data?.bike) return
    const token = authApi.getToken()
    if (!token) {
      navigate('/login', { replace: true })
      return
    }
    const mileage = Number(mileageInput.replace(/,/g, ''))
    if (!Number.isFinite(mileage) || mileage < 0) {
      setUpdateError('Enter a valid mileage')
      return
    }
    setUpdating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/bikes/${data.bike.id}/mileage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ current_mileage: mileage }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || 'Update failed')
      }
      const updated = (await res.json()) as Bike
      setData((prev) => (prev ? { ...prev, bike: updated } : prev))
      setUpdateSuccess('Mileage updated')
      setTimeout(() => setUpdateSuccess(''), 2000)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined motion-safe:animate-spin">sync</span>
          <span className="font-mono text-[11px] tracking-widest uppercase">Loading garage…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex flex-col">
        <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md px-gutter-lg py-space-sm flex items-center justify-between border-b border-surface-container-highest">
          <Link to="/" className="flex items-center gap-space-sm">
            <img src="/stator-logo.png" alt="Stator" width={32} height={32} className="h-8 w-8 object-contain rounded-md" />
            <span className="font-headline-sm text-headline-sm font-bold uppercase">STATOR</span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center p-gutter">
          <div className="max-w-md w-full bg-surface-container-low border border-surface-container-highest rounded-xl p-space-xl text-center">
            <p className="font-label-xs text-label-xs text-error tracking-widest uppercase">Error</p>
            <p className="mt-2 text-body-sm text-on-surface-variant">{error}</p>
            <button onClick={handleLogout} className="mt-4 h-9 px-4 bg-primary text-on-primary rounded font-label-md">
              Sign in again
            </button>
          </div>
        </main>
      </div>
    )
  }

  const bike = data?.bike

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md px-gutter-lg py-space-sm flex items-center justify-between border-b border-surface-container-highest">
        <Link to="/" className="flex items-center gap-space-sm">
          <img src="/stator-logo.png" alt="Stator" width={32} height={32} className="h-8 w-8 object-contain rounded-md" />
          <span className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight">STATOR</span>
          <span className="hidden sm:inline-flex font-mono text-[10px] tracking-[0.12em] uppercase bg-surface-container border border-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full">GARAGE // LIVE</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline font-mono text-[11px] tracking-widest uppercase text-on-surface-variant truncate max-w-[180px]">{data?.user.email}</span>
          <button
            onClick={handleLogout}
            className="h-9 inline-flex items-center gap-1.5 px-3 rounded border border-surface-container-highest bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-label-md transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span> Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1160px] px-gutter-lg py-6 sm:py-8">
        {/* Welcome */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-label-xs text-label-xs tracking-[0.14em] uppercase text-primary">GARAGE // DASHBOARD</div>
            <h1 className="mt-1 font-headline-lg text-headline-lg font-bold uppercase tracking-tight">
              Welcome, <span className="text-primary">{data?.user.email.split('@')[0]}</span>
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Your commuter at a glance — mileage, status, and history.</p>
          </div>
          <div className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant/60 hidden sm:block">STAGE_03 // DASHBOARD</div>
        </div>

        {/* Bike card */}
        <div className="mt-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-4">
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-container border border-surface-container-highest flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">sports_motorsports</span>
                </div>
                <div>
                  <div className="font-label-xs text-label-xs tracking-widest uppercase text-on-surface-variant">
                    {bike?.category || 'Commuter'} • {bike?.year}
                  </div>
                  <div className="font-headline-md text-headline-md font-bold uppercase tracking-tight">
                    {bike ? `${bike.make} ${bike.model}` : 'No bike yet'}
                  </div>
                  <div className="font-mono text-[11px] tracking-wider text-on-surface-variant truncate">
                    {bike?.vin ? `VIN ${bike.vin}` : `ID ${bike?.id.slice(0, 8)}`}
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-mono text-[10px] tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> LIVE
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-surface-container border border-surface-container-highest p-3 text-center">
                <div className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Odometer</div>
                <div className="font-headline-md text-headline-md font-bold mt-1">{bike?.current_mileage.toLocaleString()} <span className="font-label-xs text-label-xs text-on-surface-variant">KM</span></div>
                <div className="font-mono text-[10px] text-secondary mt-0.5">Current</div>
              </div>
              <div className="rounded-lg bg-surface-container border border-surface-container-highest p-3 text-center">
                <div className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Due soon</div>
                <div className="font-headline-md text-headline-md font-bold mt-1">2</div>
                <div className="font-mono text-[10px] text-primary mt-0.5">Oil · Chain</div>
              </div>
              <div className="rounded-lg bg-surface-container border border-surface-container-highest p-3 text-center">
                <div className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">Overdue</div>
                <div className="font-headline-md text-headline-md font-bold mt-1">0</div>
                <div className="font-mono text-[10px] text-on-surface-variant mt-0.5">All clear</div>
              </div>
            </div>

            {/* Update mileage */}
            <form onSubmit={handleUpdateMileage} className="mt-5 flex gap-2">
              <div className="flex-1 relative">
                <input
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value.replace(/[^0-9,]/g, ''))}
                  inputMode="numeric"
                  pattern="[0-9,]*"
                  placeholder="14,820"
                  className="w-full h-10 pl-3 pr-10 bg-surface-container text-on-surface font-mono tabular-nums rounded border border-surface-container-highest focus:outline-none focus-visible:ring-1 focus-visible:ring-primary placeholder:text-outline-variant/60"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] tracking-widest text-outline">KM</span>
              </div>
              <button
                type="submit"
                disabled={updating}
                className="h-10 px-4 rounded bg-primary text-on-primary font-label-md font-bold hover:bg-primary-fixed disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {updating ? <span className="material-symbols-outlined motion-safe:animate-spin text-[16px]">sync</span> : <span className="material-symbols-outlined text-[16px]">speed</span>}
                {updating ? 'Saving…' : 'Update'}
              </button>
            </form>
            {updateError && <div role="alert" className="mt-2 text-error text-label-md bg-error-container/20 border border-error/20 rounded px-3 py-2">{updateError}</div>}
            {updateSuccess && <div className="mt-2 text-secondary text-label-md bg-secondary/10 border border-secondary/20 rounded px-3 py-2">{updateSuccess}</div>}
            <p className="mt-2 font-label-xs text-label-xs text-on-surface-variant">Tip: update mileage after each ride — dashboard recalculates due.</p>
          </div>

          {/* Intervals preview */}
          <div className="bg-surface-container-low border border-surface-container-highest rounded-xl p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight">Service Intervals</h2>
              <span className="font-mono text-[10px] tracking-widest uppercase text-on-surface-variant">M3 — PRESETS</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Presets for oil, chain, tires, valves, brake fluid — intervals coming next.</p>

            <div className="mt-4 space-y-2 flex-1">
              {[
                { name: 'Oil Change', left: '420 KM left', pct: 86, tone: 'soon' as const },
                { name: 'Chain Lube', left: 'Overdue 80 KM', pct: 100, tone: 'overdue' as const },
                { name: 'Valve Check', left: '8,200 KM left', pct: 32, tone: 'ok' as const },
              ].map((r) => (
                <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-surface-container border border-surface-container-highest/60 px-3 py-2.5">
                  <span className={`material-symbols-outlined text-[16px] shrink-0 ${r.tone === 'overdue' ? 'text-error' : r.tone === 'soon' ? 'text-primary' : 'text-secondary'}`}>
                    {r.tone === 'overdue' ? 'warning' : r.tone === 'soon' ? 'schedule' : 'check_circle'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-label-md text-label-md font-medium truncate">{r.name}</span>
                      <span className={`font-mono text-[10px] tracking-wider uppercase shrink-0 ${r.tone === 'overdue' ? 'text-error' : 'text-on-surface-variant'}`}>{r.left}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                      <div className={`h-full ${r.tone === 'overdue' ? 'bg-error' : r.tone === 'soon' ? 'bg-primary' : 'bg-secondary'}`} style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg bg-surface-container border border-surface-container-highest/60 p-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[16px]">info</span>
              <p className="font-label-xs text-label-xs text-on-surface-variant leading-tight">Next milestone will make these live — backed by `interval_miles` vs `current_mileage - last_done`.</p>
            </div>
          </div>
        </div>

        {/* History teaser */}
        <div className="mt-4 bg-surface-container-low border border-surface-container-highest rounded-xl p-4 flex items-center justify-between gap-3">
          <div>
            <div className="font-label-xs text-label-xs tracking-widest uppercase text-on-surface-variant">Service History</div>
            <div className="font-body-sm text-body-sm text-on-surface-variant">Log a service → history table + interval reset (M4).</div>
          </div>
          <span className="hidden sm:inline-flex font-mono text-[10px] tracking-widest uppercase px-2 py-1 rounded bg-surface-container border border-surface-container-highest text-primary">COMING M4</span>
        </div>
      </main>

      <footer className="w-full py-space-sm px-gutter-lg flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant border-t border-surface-container-highest/40">
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">MACHINE & MOTOR // TWO WHEELS ONLY</span>
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">PRECISION // ASPHALT & STEEL</span>
      </footer>
    </div>
  )
}
