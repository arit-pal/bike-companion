import type { DashboardStatus } from '@/features/service-intervals/types'

type StatusCardProps = {
  row: DashboardStatus
  /** Full interval length in KM — used for the progress bar. Falls back to remaining when unknown. */
  intervalMiles?: number
}

export function StatusCard({ row, intervalMiles }: StatusCardProps) {
  const overdue = row.status === 'Overdue'
  const soon = row.status === 'Due Soon'
  const total = intervalMiles && intervalMiles > 0 ? intervalMiles : Math.max(row.miles_remaining, 1)
  const used = total - row.miles_remaining
  const pct = Math.min(100, Math.max(0, Math.round((used / total) * 100)))

  const label =
    row.miles_remaining < 0
      ? `Overdue ${Math.abs(row.miles_remaining).toLocaleString()} KM`
      : row.miles_remaining === 0
        ? 'Due now'
        : `${row.miles_remaining.toLocaleString()} KM left`

  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-surface-container border border-surface-container-highest/60 px-3 py-2.5">
      <span
        className={`material-symbols-outlined text-[16px] shrink-0 ${overdue ? 'text-error' : soon ? 'text-primary' : 'text-secondary'}`}
      >
        {overdue ? 'warning' : soon ? 'schedule' : 'check_circle'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-md text-label-md font-medium truncate">{row.name}</span>
          <span
            className={`font-mono text-[10px] tracking-wider uppercase shrink-0 ${overdue ? 'text-error' : 'text-on-surface-variant'}`}
          >
            {label}
          </span>
        </div>
        <div className="mt-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
          <div
            className={`h-full ${overdue ? 'bg-error' : soon ? 'bg-primary' : 'bg-secondary'}`}
            style={{ width: `${overdue ? 100 : pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
