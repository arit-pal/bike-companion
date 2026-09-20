// Backend-matching types for service intervals (snake_case, as returned by Go engine).
export type ServiceInterval = {
  id: string
  bike_id: string
  name: string
  interval_miles: number
  interval_days?: number | null
  last_done_mileage: number
  last_done_date?: string | null
  created_at: string
  updated_at: string
}

export type CreateIntervalPayload = {
  name: string
  interval_miles: number
  interval_days?: number
  last_done_mileage: number
  last_done_date?: string
}

export type UpdateIntervalPayload = {
  name?: string
  interval_miles?: number
  interval_days?: number
  last_done_mileage?: number
  last_done_date?: string
}

// KM-only quick-add presets for a daily commuter.
export type IntervalPreset = {
  name: string
  interval_miles: number
  interval_days?: number
  blurb: string
}

export const INTERVAL_PRESETS: IntervalPreset[] = [
  { name: 'Oil Change', interval_miles: 5000, blurb: 'Engine oil + filter' },
  { name: 'Chain Lube', interval_miles: 800, blurb: 'Lube every ~2 tanks' },
  { name: 'Chain Clean', interval_miles: 1500, blurb: 'Degrease + inspect slack' },
  { name: 'Tire Check', interval_miles: 8000, blurb: 'Tread + pressure + age' },
  { name: 'Brake Fluid', interval_miles: 20000, interval_days: 730, blurb: 'DOT flush every 2 yrs' },
  { name: 'Valve Check', interval_miles: 12000, blurb: 'Clearances + plugs' },
  { name: 'Air Filter', interval_miles: 10000, blurb: 'Inspect, replace if dusty' },
]
