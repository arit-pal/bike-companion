import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/features/auth/api/auth'
import { AuthCard, AuthShell } from '@/features/auth/components/AuthShell'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStatus('loading')
    try {
      await authApi.login({ email, password })
      setStatus('success')
      setTimeout(() => {
        navigate('/')
      }, 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setStatus('idle')
    }
  }

  return (
    <AuthShell>
      <AuthCard>
        {/* Header badge */}
        <div className="flex flex-col items-center text-center mb-space-md">
          <div className="flex items-center gap-3 mb-space-sm">
            <div className="w-9 h-9 rounded-lg border border-outline-variant/40 bg-surface-container-low flex items-center justify-center shadow-inner">
              <img
                src="/stator-logo.png"
                alt="Stator Emblem"
                width={24}
                height={24}
                className="w-6 h-6 object-contain rounded"
              />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container-high border border-surface-container-highest text-primary font-mono text-[11px] uppercase tracking-widest font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>AUTH_01 // RIDER ACCESS PROTOCOL</span>
            </div>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold uppercase">
            RIDER AUTHENTICATION
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-sm">
            Verify operator credentials to access machine telemetry &amp; service logs
          </p>
        </div>

        <form className="flex flex-col gap-space-md" onSubmit={handleAuth}>
          <div className="flex flex-col gap-1.5 text-left">
            <label
              className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider flex justify-between items-center"
              htmlFor="riderId"
            >
              <span>Master Operator Email</span>
              <span className="text-secondary font-mono text-[10px] tracking-wider uppercase">
                AUTH_KEY // LOCAL
              </span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
                alternate_email
              </span>
              <input
                className="w-full h-11 pl-10 pr-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 focus:bg-surface-container-highest/40 transition-all placeholder:text-on-surface-variant/40"
                id="riderId"
                placeholder="rider@stator.com"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex justify-between items-center">
              <label
                className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                htmlFor="masterPassword"
              >
                Access Cipher
              </label>
              <span className="text-secondary font-mono text-[10px] tracking-wider uppercase">
                CIPHER // ENCRYPTED
              </span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none">
                lock
              </span>
              <input
                className="w-full h-11 pl-10 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-all placeholder:text-on-surface-variant/40"
                id="masterPassword"
                placeholder="••••••••••••"
                required
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                aria-label={showPass ? 'Hide password' : 'Show password'}
                aria-pressed={showPass}
                className="absolute right-2.5 w-7 h-7 flex items-center justify-center text-outline hover:text-on-surface transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                type="button"
                onClick={() => setShowPass((v) => !v)}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPass ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="text-error text-body-sm bg-error-container/20 border border-error/20 rounded px-3 py-2"
            >
              {error}
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3 rounded bg-surface-container border border-surface-container-highest/40 text-on-surface-variant/80">
            <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">shield</span>
            <p className="font-body-sm text-body-sm leading-relaxed text-[12px]">
              <span className="text-on-surface font-medium">Encrypted Database Telemetry.</span> All machine
              records, service intervals, and access credentials are encrypted.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              className="w-full h-11 bg-primary hover:bg-primary-fixed text-on-primary-container font-headline-sm text-headline-sm font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 px-4 transition-all shadow-md active:translate-y-0.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none motion-reduce:active:translate-y-0"
              type="submit"
              disabled={status !== 'idle'}
              aria-disabled={status !== 'idle'}
              aria-busy={status === 'loading'}
            >
              {status === 'idle' && (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  <span>Enter Garage</span>
                </>
              )}
              {status === 'loading' && (
                <>
                  <span className="material-symbols-outlined motion-safe:animate-spin text-[18px]">sync</span>
                  <span>Initializing telemetry...</span>
                  <span className="font-label-xs text-label-xs text-on-primary-container ml-auto">SYS-OK</span>
                </>
              )}
              {status === 'success' && (
                <>
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  <span>Access Granted</span>
                  <span className="font-label-xs text-label-xs text-on-primary-container ml-auto">READY</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-space-md flex flex-col items-center gap-space-sm">
          <div className="flex items-center justify-center gap-1.5 text-center">
            <span className="font-body-sm text-body-sm text-on-surface-variant">First commuter bike?</span>
            <Link
              className="font-body-sm text-body-sm text-primary hover:text-primary-fixed underline underline-offset-4 decoration-primary/40 hover:decoration-primary font-medium transition-colors"
              to="/register"
            >
              Set up garage
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  )
}
