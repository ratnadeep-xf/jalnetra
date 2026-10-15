export function Spinner({ label }: { label: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      role="status"
    >
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
