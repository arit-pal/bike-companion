import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-surface-container-low border border-surface-container-highest rounded-xl p-space-md shadow-sm ${className}`.trim()}
    >
      {children}
    </div>
  )
}
