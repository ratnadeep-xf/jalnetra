import type { PriorityClass } from "@/types";

/**
 * CPCB priority class from BOD (mg/L).
 *
 * Shared boundaries sit with the less severe class: 30 is II, 20 is II,
 * 10 is III, 6 is IV, and 3 is Compliant.
 */
export function classifyBod(bod: number): PriorityClass {
  if (bod > 30) return "I";
  if (bod >= 20) return "II";
  if (bod >= 10) return "III";
  if (bod >= 6) return "IV";
  if (bod > 3) return "V";
  return "Compliant";
}

export const CLASS_META: Record<
  PriorityClass,
  { label: string; color: string; description: string }
> = {
  I: {
    label: "Priority I",
    color: "#7f1d1d",
    description: "BOD above 30 mg/L. Critically polluted.",
  },
  II: {
    label: "Priority II",
    color: "#dc2626",
    description: "BOD 20–30 mg/L. Severely polluted.",
  },
  III: {
    label: "Priority III",
    color: "#f97316",
    description: "BOD 10–20 mg/L. Heavily polluted.",
  },
  IV: {
    label: "Priority IV",
    color: "#eab308",
    description: "BOD 6–10 mg/L. Moderately polluted.",
  },
  V: {
    label: "Priority V",
    color: "#84cc16",
    description: "BOD 3–6 mg/L. Slightly polluted.",
  },
  Compliant: {
    label: "Compliant",
    color: "#16a34a",
    description: "BOD at or below 3 mg/L. Meets the use threshold.",
  },
};
