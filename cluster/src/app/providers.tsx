import type { ReactNode } from 'react'

type ProvidersProps = { children: ReactNode }

/**
 * App-level providers. Add QueryClientProvider, Theme, etc. here
 * when needed. Keeping this as a pass-through avoids churn.
 */
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>
}
