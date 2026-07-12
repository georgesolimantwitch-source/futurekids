export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900" />
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    </div>
  );
}
