import { API_BASE_URL } from '@/api/constants'
import { authApi } from '@/features/auth/api/auth'
import type { LogServicePayload, ServiceRecord } from '../types'

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

export const recordsApi = {
  async log(bikeId: string, payload: LogServicePayload): Promise<ServiceRecord> {
    const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/records`, {
      method: 'POST',
      headers: authHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) await throwForStatus(res)
    return (await res.json()) as ServiceRecord
  },

  async list(bikeId: string, intervalId?: string): Promise<ServiceRecord[]> {
    const params = new URLSearchParams()
    if (intervalId) params.set('interval_id', intervalId)
    const qs = params.toString()
    const res = await fetch(`${API_BASE_URL}/api/bikes/${bikeId}/records${qs ? `?${qs}` : ''}`, {
      headers: authHeaders(),
      credentials: 'include',
    })
    if (!res.ok) await throwForStatus(res)
    return (await res.json()) as ServiceRecord[]
  },
}
