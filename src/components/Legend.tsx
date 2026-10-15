import { CLASS_META } from "@/lib/classify";
import type { PriorityClass } from "@/types";

const CLASS_ORDER: PriorityClass[] = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "Compliant",
];

export function Legend() {
  return (
    <aside className="pointer-events-auto absolute bottom-8 left-3 z-[1000] max-h-[calc(100%-5rem)] w-[min(18rem,calc(100%-1.5rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg">
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        Priority class
      </p>
      <ul className="space-y-1.5">
        {CLASS_ORDER.map((priority) => {
          const meta = CLASS_META[priority];
          return (
            <li key={priority} className="flex items-start gap-2">
              <span
                className="mt-0.5 h-3 w-3 shrink-0 rounded-full border border-slate-900/15"
                style={{ backgroundColor: meta.color }}
              />
              <span className="text-xs leading-snug text-slate-600">
                <span className="font-medium text-slate-800">{meta.label}.</span>{" "}
                {meta.description}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-slate-400">
        Classes based on CPCB BOD priority thresholds
      </p>
    </aside>
  );
}
