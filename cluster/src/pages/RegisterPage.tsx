import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/features/auth/api/auth'
import { AuthCard, AuthShell } from '@/features/auth/components/AuthShell'
import { usePasswordStrength } from '@/features/auth/hooks/usePasswordStrength'

type Step1Data = {
  email: string
  password: string
  confirmPassword: string
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)

  // step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { score, label } = usePasswordStrength(password)
  const [step1Error, setStep1Error] = useState('')
  const currentYear = new Date().getFullYear()

  // step 2
  const [makeModel, setMakeModel] = useState('')
  const [year, setYear] = useState('')
  const [odometer, setOdometer] = useState('')
  const [category, setCategory] = useState('')
  const [vin, setVin] = useState('')
  const [registerStatus, setRegisterStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [registerError, setRegisterError] = useState('')

  const [savedStep1, setSavedStep1] = useState<Step1Data | null>(null)

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    setStep1Error('')
    if (password.length < 10) {
      setStep1Error('Access cipher must be at least 10 characters')
      return
    }
    if (password !== confirm) {
      setStep1Error('Ciphers do not match')
      return
    }
    setSavedStep1({ email, password, confirmPassword: confirm })
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!savedStep1) return
    setRegisterError('')
    if (!makeModel || !year || !odometer) {
      setRegisterError('Please fill make/model, year and odometer')
      return
    }
    setRegisterStatus('loading')
    try {
      await authApi.register({
        email: savedStep1.email,
        password: savedStep1.password,
        confirmPassword: savedStep1.confirmPassword,
        makeModel,
        year: Number(year),
        odometer,
        odometerUnit: 'KM',
        category,
        vin,
      })
      setRegisterStatus('success')
      setTimeout(() => navigate('/login'), 900)
    } catch (err) {
      setRegisterStatus('idle')
      setRegisterError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  const barColor = (idx: number) => {
    if (password.length === 0) return 'bg-surface-container-highest'
    if (idx >= score) return 'bg-surface-container-highest'
    if (score === 1) return 'bg-error'
    if (score === 2) return 'bg-primary-container'
    if (score === 3) return 'bg-secondary'
    return 'bg-primary'
  }

  return (
    <AuthShell>
      <AuthCard>
        {step === 1 ? (
          <>
            <div className="flex items-center justify-between pb-space-md mb-space-md">
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="font-label-xs text-label-xs text-primary font-mono tracking-widest uppercase">
                    STAGE_01 // STEP 1 OF 2: OPERATOR CREDENTIALS
                  </span>
                </div>
                <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight uppercase font-semibold">
                  Create Garage Profile
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Initialize rider registry and security key
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <img
                  src="/stator-logo.png"
                  width={32}
                  height={32}
                  alt="Stator"
                  className="w-8 h-8 object-contain rounded"
                />
              </div>
            </div>

            <form className="flex flex-col gap-space-md" onSubmit={handleStep1}>
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">
                    01. Rider Credentials
                  </span>
                  <span className="font-label-xs text-label-xs text-primary font-mono">AUTH_KEY // 256-BIT</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                    htmlFor="rider-email"
                  >
                    Master Operator Email
                  </label>
                  <div className="relative flex items-center">
                    <input
                      className="w-full h-10 pl-3 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 placeholder:truncate rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors"
                      id="rider-email"
                      placeholder="rider@garage.com"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <span className="absolute right-3 material-symbols-outlined text-outline text-[16px] pointer-events-none">
                      alternate_email
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label
                      className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                      htmlFor="master-pass"
                    >
                      Access Cipher
                    </label>
                    <span
                      aria-live="polite"
                      className="font-label-xs text-label-xs text-outline-variant font-mono uppercase tracking-tight"
                    >
                      {label}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      className="w-full h-10 pl-3 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 placeholder:truncate rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors"
                      id="master-pass"
                      placeholder="Min 10 chars, alphanum & spec"
                      required
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      aria-label={showPass ? 'Hide cipher' : 'Show cipher'}
                      aria-pressed={showPass}
                      className="absolute right-3 text-outline hover:text-on-surface flex items-center focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-colors duration-200 ${barColor(i)}`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-col gap-1 pt-space-xs">
                    <label
                      className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                      htmlFor="confirm-pass"
                    >
                      Confirm Access Cipher
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-10 px-3 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors"
                        id="confirm-pass"
                        placeholder="Repeat access cipher"
                        required
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                      <button
                        aria-label={showConfirm ? 'Hide confirm cipher' : 'Show confirm cipher'}
                        aria-pressed={showConfirm}
                        className="absolute right-3 text-outline hover:text-on-surface flex items-center focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {showConfirm ? 'visibility_off' : 'lock_reset'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {step1Error && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="text-error text-label-md bg-error-container/20 border border-error/20 rounded px-3 py-2"
                >
                  {step1Error}
                </div>
              )}

              <div className="flex items-center gap-space-xs p-2.5 rounded bg-surface-container/60">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0">shield</span>
                <p className="font-label-xs text-label-xs text-on-surface-variant leading-tight">
                  <strong className="text-on-surface font-semibold">Encrypted Database Telemetry.</strong> All
                  machine records, service intervals, and access credentials are encrypted.
                </p>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <button
                  className="w-full h-11 bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold rounded flex items-center justify-center gap-space-xs hover:bg-primary-container active:scale-[0.99] transition-all shadow-md motion-reduce:transition-none"
                  type="submit"
                >
                  <span>NEXT: MACHINE SETUP</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <div className="flex items-center justify-center gap-1 text-center">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Already registered?</span>
                  <Link
                    className="font-body-sm text-body-sm text-primary hover:text-primary-fixed-dim transition-colors font-medium ml-1 flex items-center gap-0.5"
                    to="/login"
                  >
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between pb-space-md mb-space-md">
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs mb-1">
                  <span className="font-label-xs text-label-xs text-primary font-mono tracking-widest uppercase">
                    STAGE_02 // STEP 2 OF 2: PRIMARY MACHINE
                  </span>
                </div>
                <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight uppercase font-semibold">
                  REGISTER PRIMARY MACHINE
                </h1>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Specify your daily commuter or primary motorcycle telemetry datum
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <img
                  alt="Stator"
                  className="w-8 h-8 object-contain rounded"
                  src="/stator-logo.png"
                  width={32}
                  height={32}
                />
              </div>
            </div>

            <form className="flex flex-col gap-space-md" onSubmit={handleRegister}>
              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-xs text-label-xs uppercase tracking-wider text-on-surface-variant">
                    01. PRIMARY MACHINE SPECIFICATION
                  </span>
                  <span className="font-label-xs text-label-xs text-secondary font-mono">VIN_REF // OPTIONAL</span>
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                    htmlFor="bike-model"
                  >
                    Make &amp; Model Specification
                  </label>
                  <div className="relative flex items-center">
                    <input
                      className="w-full h-10 pl-3 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 placeholder:truncate rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors"
                      id="bike-model"
                      placeholder="e.g. Yamaha Tenere 700 / Honda CB650R"
                      required
                      type="text"
                      value={makeModel}
                      onChange={(e) => setMakeModel(e.target.value)}
                    />
                    <span className="absolute right-3 material-symbols-outlined text-outline text-[16px] pointer-events-none">
                      sports_motorsports
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label
                      className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                      htmlFor="bike-year"
                    >
                      Production Year
                    </label>
                    <input
                      className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors font-mono"
                      id="bike-year"
                      max={currentYear + 1}
                      min={1960}
                      placeholder={String(currentYear)}
                      required
                      type="number"
                      inputMode="numeric"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                      htmlFor="bike-odometer"
                    >
                      Odometer <span className="font-mono text-outline-variant">(KM)</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-10 pl-3 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors font-mono tabular-nums"
                        id="bike-odometer"
                        placeholder="12,450"
                        required
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9,]*"
                        value={odometer}
                        onChange={(e) => setOdometer(e.target.value.replace(/[^0-9,]/g, ''))}
                      />
                        <span className="absolute right-3 font-label-xs text-label-xs text-outline font-mono pointer-events-none">KM</span>
                      </div>
                    </div>
                  </div>
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col gap-1">
                    <label
                      className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                      htmlFor="bike-category"
                    >
                      Motorcycle Type
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-10 pl-3 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 placeholder:truncate rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors"
                        id="bike-category"
                        placeholder="Commuter"
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      />
                      <span className="absolute right-3 material-symbols-outlined text-outline text-[16px] pointer-events-none">
                        two_wheeler
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider"
                      htmlFor="bike-vin"
                    >
                      VIN / Chassis Ref
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full h-10 pl-3 pr-10 bg-surface-container-lowest text-on-surface font-label-md text-label-md placeholder:text-outline-variant/60 placeholder:truncate rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus:bg-surface-container-highest/40 transition-colors font-mono uppercase text-[11px]"
                        id="bike-vin"
                        placeholder="Optional ID code"
                        type="text"
                        value={vin}
                        onChange={(e) => setVin(e.target.value)}
                      />
                      <span className="absolute right-3 material-symbols-outlined text-outline text-[16px] pointer-events-none">
                        tag
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {registerError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="text-error text-label-md bg-error-container/20 border border-error/20 rounded px-3 py-2"
                >
                  {registerError}
                </div>
              )}

              <div className="flex items-center gap-space-xs p-2.5 rounded bg-surface-container/60">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0">lock</span>
                <p className="font-label-xs text-label-xs text-on-surface-variant leading-tight">
                  Encrypted Database Telemetry. All machine records, service intervals, and access credentials are
                  encrypted.
                </p>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <button
                  className="w-full h-11 bg-primary text-on-primary font-headline-sm text-headline-sm font-semibold rounded flex items-center justify-center gap-space-xs hover:bg-primary-container active:scale-[0.99] transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed motion-reduce:transition-none"
                  type="submit"
                  disabled={registerStatus !== 'idle'}
                  aria-disabled={registerStatus !== 'idle'}
                  aria-busy={registerStatus === 'loading'}
                >
                  {registerStatus === 'idle' && (
                    <>
                      <span>INITIALIZE GARAGE</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                  {registerStatus === 'loading' && (
                    <>
                      <span className="material-symbols-outlined motion-safe:animate-spin text-[18px]">sync</span>
                      <span>Initializing telemetry...</span>
                    </>
                  )}
                  {registerStatus === 'success' && (
                    <>
                      <span className="material-symbols-outlined text-[18px]">done_all</span>
                      <span>Garage Initialized</span>
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-1 text-center">
                  <button
                    className="font-body-sm text-body-sm text-outline hover:text-on-surface transition-colors font-mono text-label-xs uppercase tracking-wider flex items-center gap-1"
                    type="button"
                    onClick={() => setStep(1)}
                  >
                    <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                    <span>Back to Credentials</span>
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </AuthCard>
    </AuthShell>
  )
}
