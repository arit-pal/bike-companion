import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary', error, info)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-gutter">
          <div className="max-w-md w-full bg-surface-container-low border border-surface-container-highest rounded-xl p-space-xl text-center">
            <p className="font-label-xs text-label-xs text-error tracking-widest uppercase">CRASH // UNHANDLED</p>
            <h2 className="font-headline-md text-headline-md font-bold uppercase mt-2">Something went wrong</h2>
            <p className="text-on-surface-variant text-body-sm mt-2">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-4 h-10 px-4 bg-primary text-on-primary rounded font-semibold hover:bg-primary-fixed focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
