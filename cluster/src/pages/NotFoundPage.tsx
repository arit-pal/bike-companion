import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-gutter text-center">
      <p className="font-label-xs text-label-xs text-primary tracking-widest uppercase">404 // TELEMETRY NOT FOUND</p>
      <h1 className="font-headline-lg text-headline-lg font-bold uppercase mt-2">Route not found</h1>
      <p className="text-on-surface-variant mt-2 max-w-md">The page you’re looking for doesn’t exist. Return to the garage.</p>
      <div className="flex gap-3 mt-6">
        <Link
          to="/"
          className="h-11 px-6 bg-primary text-on-primary font-semibold rounded flex items-center gap-2 hover:bg-primary-fixed focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          Back to home <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </Link>
        <Link to="/login" className="h-11 px-6 border border-surface-container-highest rounded flex items-center focus:outline-none focus-visible:ring-1 focus-visible:ring-primary">
          Sign in
        </Link>
      </div>
    </div>
  )
}
