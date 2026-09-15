import { useMemo } from 'react'

export type Strength = 0 | 1 | 2 | 3 | 4
export const strengthLabels = ['Empty', 'Fragile', 'Nominal', 'Resilient', 'Armored'] as const

export function getStrength(password: string): Strength {
  if (!password) return 0
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  return Math.min(score, 4) as Strength
}

export function usePasswordStrength(password: string) {
  return useMemo(() => {
    const score = getStrength(password)
    return { score, label: strengthLabels[password.length === 0 ? 0 : score] }
  }, [password])
}
