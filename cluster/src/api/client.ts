import { API_BASE_URL } from './constants'

const BASE_URL = API_BASE_URL
const DEFAULT_TIMEOUT_MS = 10_000

async function request<T>(path: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      // include credentials for future cookie-based auth
      credentials: 'include',
      signal: controller.signal,
    })

    if (!res.ok) {
      let details: unknown = null
      try {
        details = await res.json()
      } catch {
        details = await res.text().catch(() => null)
      }
      const message =
        typeof details === 'object' && details !== null && 'message' in details
          ? String((details as { message: unknown }).message)
          : `${init.method ?? 'GET'} ${path} failed: ${res.status}`
      const err = new Error(message) as Error & { status: number; details: unknown }
      err.status = res.status
      err.details = details
      throw err
    }

    // 204 No Content
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${path}`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const apiClient = {
  baseURL: BASE_URL,
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' })
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
  },
}
