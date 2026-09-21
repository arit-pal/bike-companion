import type { DashboardStatus } from '@/features/service-intervals/types'

const toneRank: Record<DashboardStatus['status'], number> = {
  Overdue: 0,
  'Due Soon': 1,
  OK: 2,
}

export function statusRank(s: DashboardStatus['status']): number {
  return toneRank[s] ?? 3
}
