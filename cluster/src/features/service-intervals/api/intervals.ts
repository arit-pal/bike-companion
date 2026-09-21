import { API_BASE_URL } from '@/api/constants'
import { authApi } from '@/features/auth/api/auth'
import type {
  CreateIntervalPayload,
  DashboardStatus,
  ServiceInterval,
  UpdateIntervalPayload,
} from '../types'

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.message === 'string') return data.message
    return JSON.stringify(data)
  } catch {
    return `Request failed: ${res.status}`
  }
}

async function throwForStatus(res: Response): Promise<never> {
  const message = await parseError(res)
  const err = new Error(message) as Error & { status: number }
  err.status = res.status
  throw err
}
function authHeaders(): Record<string, string> {
  const token = authApi.getToken()
  if (!token) {
    const err = new Error('Not authenticated') as Error & { status: number }
    err.status = 401
    throw err
  }
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export const intervalsApi = {
  async list(bikeId: string): Promise<ServiceInterval[]> {
    const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/intervals`, {
      headers: authHeaders(),
      credentials: 'include',
    })
    if (!res.ok) await throwForStatus(res)
    return (await res.json()) as ServiceInterval[]
  },

  async create(bikeId: string, payload: CreateIntervalPayload): Promise<ServiceInterval> {
    const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/intervals`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) await throwForStatus(res)
    return (await res.json()) as ServiceInterval
  },

  async update(bikeId: string, id: string, payload: UpdateIntervalPayload): Promise<ServiceInterval> {
    const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/intervals/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) await throwForStatus(res)
    return (await res.json()) as ServiceInterval
  },

  async remove(bikeId: string, id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/intervals/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
      credentials: 'include',
    })
    if (!res.ok) await throwForStatus(res)
  },

  async dashboard(bikeId: string): Promise<DashboardStatus[]> {
    const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/dashboard`, {
      headers: authHeaders(),
      credentials: 'include',
    })
    if (!res.ok) await throwForStatus(res)
    return (await res.json()) as DashboardStatus[]
  },
}
