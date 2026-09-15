export function Loader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined motion-safe:animate-spin text-[20px]">sync</span>
        <span className="font-label-md text-label-md">Loading…</span>
      </div>
    </div>
  )
}
