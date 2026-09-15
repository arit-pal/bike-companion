import { apiClient } from '@/api/client'
import type { Bike } from '../types'

export const bikesApi = {
  list: () => apiClient.get<Bike[]>('/api/bikes'),
  create: (data: Omit<Bike, 'id'>) => apiClient.post<Bike>('/api/bikes', data),
}
