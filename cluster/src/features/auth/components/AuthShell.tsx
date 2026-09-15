import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-surface text-on-surface font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container">
      <header className="w-full bg-surface-container-lowest/80 backdrop-blur-md px-gutter-lg py-space-sm flex items-center justify-between border-b border-surface-container-highest">
        <Link to="/" className="flex items-center gap-space-sm">
          <img
            src="/stator-logo.png"
            alt="Stator Logo"
            width={32}
            height={32}
            className="h-8 w-8 object-contain rounded-md"
          />
          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight uppercase font-semibold">
            STATOR
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-gutter">{children}</main>

      <footer className="w-full py-space-sm px-gutter-lg flex items-center justify-between font-label-xs text-label-xs text-on-surface-variant border-t border-surface-container-highest/40">
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">
          MACHINE &amp; MOTOR // TWO WHEELS ONLY
        </span>
        <span className="font-mono uppercase tracking-widest text-[11px] text-on-surface-variant">
          PRECISION // ASPHALT &amp; STEEL
        </span>
      </footer>
    </div>
  )
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-md bg-surface-container-low border border-surface-container-highest rounded-xl p-space-xl shadow-[0_12px_32px_-4px_rgba(0,0,0,0.65)] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="flex flex-col w-full">{children}</div>
    </div>
  )
}
