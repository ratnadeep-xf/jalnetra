import { Droplets } from "lucide-react";

export function Header() {
  return (
    <header className="z-10 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
        <Droplets className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold leading-tight tracking-tight text-slate-900">
          JalNetra
        </p>
        <p className="text-xs leading-snug text-slate-500 sm:text-sm">
          Smart Sabarmati Riverfront & Urban Water Bodies
        </p>
      </div>
    </header>
  );
}
