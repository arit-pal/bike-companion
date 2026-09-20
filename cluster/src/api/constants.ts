// Placeholder API endpoints — wired via env, stubbed for static preview.
// Replace with real backend when Go engine exposes these.

function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (!raw) {
    if (import.meta.env.PROD) {
      // Fail fast in prod if env missing — avoids silent localhost calls
      throw new Error('VITE_API_URL is required in production')
    }
    return 'http://localhost:8080'
  }
  // Basic validation — must be http(s)
  try {
    const u = new URL(raw)
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('invalid protocol')
    return u.origin + (u.pathname !== '/' ? u.pathname.replace(/\/$/, '') : '')
  } catch {
    throw new Error(`VITE_API_URL is invalid: ${raw}`)
  }
}

export const API_BASE_URL = getApiBaseUrl()

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  bikes: {
    list: `${API_BASE_URL}/api/bikes`,
    create: `${API_BASE_URL}/api/bikes`,
    byId: (id: string) => `${API_BASE_URL}/api/bikes/${id}`,
  },
  serviceIntervals: {
    list: (bikeId: string) => `${API_BASE_URL}/api/bikes/${bikeId}/intervals`,
    create: (bikeId: string) => `${API_BASE_URL}/api/bikes/${bikeId}/intervals`,
    byId: (bikeId: string, id: string) => `${API_BASE_URL}/api/bikes/${bikeId}/intervals/${id}`,
    dashboard: (bikeId: string) => `${API_BASE_URL}/api/bikes/${bikeId}/dashboard`,
  },
  serviceRecords: {
    list: (bikeId: string) => `${API_BASE_URL}/api/bikes/${bikeId}/records`,
    create: (bikeId: string) => `${API_BASE_URL}/api/bikes/${bikeId}/records`,
  },
} as const
