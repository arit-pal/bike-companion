import { API_ENDPOINTS } from '@/api/constants'
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types'

// Stubbed API — logs and resolves locally until Go engine is wired.
// Uses constants from @/api/constants (env-based) so swap is one line later.

async function fakeLatency() {
  await new Promise((r) => setTimeout(r, 600))
}

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (import.meta.env.DEV) {
      // dev-only trace, never logs password in prod
      // eslint-disable-next-line no-console
      console.info('[STUB] POST', API_ENDPOINTS.auth.login, { email: payload.email })
    }
    await fakeLatency()
    return { token: 'stub-token', user: { email: payload.email } }
  },
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[STUB] POST', API_ENDPOINTS.auth.register, { email: payload.email })
    }
    await fakeLatency()
    return { token: 'stub-token', user: { email: payload.email } }
  },
}
