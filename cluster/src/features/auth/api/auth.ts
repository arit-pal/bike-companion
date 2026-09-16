import { API_ENDPOINTS } from '@/api/constants'
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types'

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data?.error === 'string') return data.error
    if (typeof data?.message === 'string') return data.message
    return JSON.stringify(data)
  } catch {
    try {
      const text = await res.text()
      return text || `Request failed: ${res.status}`
    } catch {
      return `Request failed: ${res.status}`
    }
  }
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await fetch(API_ENDPOINTS.auth.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const msg = await parseError(res)
      throw new Error(msg)
    }

    const data = (await res.json()) as AuthResponse
    if (data.token) {
      localStorage.setItem('stator_token', data.token)
      localStorage.setItem('stator_user', JSON.stringify(data.user))
    }
    return data
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(API_ENDPOINTS.auth.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const msg = await parseError(res)
      throw new Error(msg)
    }

    const data = (await res.json()) as AuthResponse
    if (data.token) {
      localStorage.setItem('stator_token', data.token)
      localStorage.setItem('stator_user', JSON.stringify(data.user))
    }
    return data
  },

  async me(): Promise<AuthResponse> {
    const token = localStorage.getItem('stator_token')
    if (!token) throw new Error('Not authenticated')

    const res = await fetch(API_ENDPOINTS.auth.me, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    })

    if (!res.ok) {
      const msg = await parseError(res)
      throw new Error(msg)
    }

    return (await res.json()) as AuthResponse
  },

  logout() {
    localStorage.removeItem('stator_token')
    localStorage.removeItem('stator_user')
  },

  getToken(): string | null {
    return localStorage.getItem('stator_token')
  },
}
