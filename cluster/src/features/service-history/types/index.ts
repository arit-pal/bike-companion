export type ServiceRecord = {
  id: string
  bikeId: string
  serviceIntervalId?: string
  datePerformed: string
  mileageAtService: number
  cost?: number
  notes?: string
}
