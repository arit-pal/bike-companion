// Backend-matching types for service records (snake_case, as returned by Go engine).
export type ServiceRecord = {
  id: string
  bike_id: string
  service_interval_id?: string | null
  date_performed: string
  mileage_at_service: number
  cost?: number | null
  notes?: string | null
  created_at: string
}

export type LogServicePayload = {
  service_interval_id?: string
  date_performed: string // YYYY-MM-DD
  mileage_at_service: number
  cost?: number
  notes?: string
}
