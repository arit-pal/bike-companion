import { Link } from 'react-router-dom'

export function DashboardPlaceholder() {
  return (
    <div className="h-screen overflow-hidden bg-surface text-on-surface flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      {/* Header — identical to AuthShell (login/register) — same bg/border/padding/typography */}
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md px-gutter-lg py-space-sm flex items-center justify-between border-b border-surface-container-highest">
        <Link to="/" className="flex items-center gap-space-sm">
          <img src="/stator-logo.png" alt="Stator Logo" width={32} height={32} className="h-8 w-8 object-contain rounded-md" />
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight uppercase font-semibold">STATOR</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="inline-flex items-center justify-center h-9 px-4 rounded border border-surface-container-highest bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-label-md font-medium transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded bg-primary text-on-primary font-label-md font-bold tracking-wide hover:bg-primary-fixed transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-md"
          >
            Create garage <span className="material-symbols-outlined text-[16px] leading-none">arrow_forward</span>
          </Link>
        </div>
      </header>

      {/* Single viewport — no scroll */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-gutter-lg py-4 sm:py-6 overflow-hidden">
        <div className="w-full max-w-[1160px] grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-center">
          {/* Left — words match auth pages */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-high border border-surface-container-highest text-primary font-mono text-[11px] tracking-widest uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              STAGE_01 // GARAGE INITIALIZED — RIDER PROTOCOL
            </div>

            <h1 className="mt-3 font-display-lg text-[30px] sm:text-[42px] lg:text-[48px] font-bold tracking-[-0.03em] leading-[0.88] uppercase">
              <span className="block text-on-surface">Ride hard.</span>
              <span className="block text-primary">We remember.</span>
            </h1>

            <p className="mt-3 max-w-[520px] font-body-md text-body-md sm:text-body-lg text-on-surface-variant leading-relaxed">
              Initialize your garage and rider registry. Mileage, service intervals, and history —
              <span className="text-on-surface font-medium"> encrypted, precision for asphalt & steel.</span>
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="h-11 inline-flex items-center justify-center gap-2 px-6 rounded bg-primary text-on-primary font-headline-sm text-headline-sm font-bold uppercase tracking-wide hover:bg-primary-fixed active:translate-y-px transition-all shadow-md"
              >
                Initialize garage <span className="material-symbols-outlined text-[18px]">bolt</span>
              </Link>
              <Link
                to="/login"
                className="h-11 inline-flex items-center justify-center gap-2 px-6 rounded border border-surface-container-highest bg-surface-container text-on-surface font-headline-sm text-headline-sm hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">login</span> Enter garage
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[14px]">shield</span> Encrypted telemetry
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[14px]">speed</span> KM
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[14px]">history</span> Service history
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3 font-label-xs text-label-xs tracking-widest uppercase text-on-surface-variant/60">
              <span className="shrink-0">MACHINE & MOTOR // TWO WHEELS ONLY</span>
              <span className="h-px flex-1 bg-surface-container-highest hidden sm:block" />
            </div>
          </div>

          {/* Right — telemetry preview, same card language as auth */}
          <div className="min-w-0 lg:pl-2">
            <div className="relative bg-surface-container-low border border-surface-container-highest rounded-xl p-4 shadow-[0_12px_32px_-4px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src="/stator-logo.png" alt="" width={28} height={28} className="w-7 h-7 rounded-md object-contain shrink-0" />
                  <div className="min-w-0">
                    <div className="font-label-xs text-label-xs tracking-widest uppercase text-on-surface-variant leading-none">01. Primary Machine</div>
                    <div className="font-headline-sm text-headline-sm font-bold uppercase tracking-tight truncate">
                      Tenere 700 <span className="text-on-surface-variant font-normal">· 2023</span>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/15 border border-secondary/30 text-secondary font-mono text-[10px] tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> LIVE
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { k: 'Odometer', v: '14,820', u: 'KM', sub: '+42 today' },
                  { k: 'Due soon', v: '2', u: '', sub: 'Oil · Chain' },
                  { k: 'Overdue', v: '0', u: '', sub: 'All clear' },
                ].map((s) => (
                  <div key={s.k} className="rounded-lg bg-surface-container border border-surface-container-highest p-2 text-center">
                    <div className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant truncate">{s.k}</div>
                    <div className="font-headline-md text-headline-md font-bold leading-none mt-1">
                      {s.v} <span className="font-label-xs text-label-xs text-on-surface-variant">{s.u}</span>
                    </div>
                    <div className="font-mono text-[10px] text-secondary mt-0.5 truncate">{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 space-y-2">
                {[
                  { name: 'Oil Change', left: '420 KM left', pct: 86, tone: 'soon' },
                  { name: 'Chain Lube', left: 'Overdue 80 KM', pct: 100, tone: 'overdue' },
                  { name: 'Valve Check', left: '8,200 KM left', pct: 32, tone: 'ok' },
                ].map((r) => (
                  <div key={r.name} className="flex items-center gap-2.5 rounded-lg bg-surface-container border border-surface-container-highest/60 px-3 py-2">
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

              <div className="mt-2.5 flex items-center justify-between gap-2 font-label-xs text-label-xs uppercase tracking-wider">
                <span className="text-on-surface-variant truncate">Next: Log service → interval resets</span>
                <Link to="/register" className="shrink-0 text-primary hover:text-primary-fixed flex items-center gap-1">
                  Try it <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full py-space-sm px-gutter-lg flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant border-t border-surface-container-highest/40">
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">MACHINE & MOTOR // TWO WHEELS ONLY</span>
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">PRECISION // ASPHALT & STEEL</span>
      </footer>
    </div>
  )
}
