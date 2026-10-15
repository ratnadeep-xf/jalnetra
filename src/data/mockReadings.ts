import type { Reading, Station } from "@/types";

/**
 * Deterministic monthly series around a station's latest sample.
 * Seeded from the station id — not Math.random — so the same station
 * always yields the same history.
 */
export function generateReadings(station: Station, months = 12): Reading[] {
  const count = Math.max(0, Math.floor(months));
  if (count === 0) return [];

  const rand = mulberry32(hashString(station.id));
  const worsening = rand() < 0.5;
  const direction = worsening ? -1 : 1;
  const readings: Reading[] = [];

  for (let index = 0; index < count; index++) {
    const date = shiftMonths(station.latest.date, index - (count - 1));

    if (index === count - 1) {
      readings.push({ ...station.latest, date });
      continue;
    }

    const age = (count - 1 - index) / (count - 1);
    const bod = clamp(
      round1(
        station.latest.bod +
          direction * age * station.latest.bod * 0.18 +
          (rand() - 0.5) * Math.max(0.4, station.latest.bod * 0.08),
      ),
      0.2,
      80,
    );
    const dissolvedOxygen = clamp(
      round1(
        station.latest.do + direction * age * -0.8 + (rand() - 0.5) * 0.3,
      ),
      0.1,
      9.5,
    );
    const ph = clamp(
      round1(station.latest.ph + (rand() - 0.5) * 0.2 * (0.4 + age)),
      6.4,
      8.8,
    );
    const ratio = station.latest.cod / Math.max(station.latest.bod, 0.4);
    const cod = clamp(round1(bod * ratio * (1 + (rand() - 0.5) * 0.08)), 1, 300);

    readings.push({ date, bod, do: dissolvedOxygen, ph, cod });
  }

  return readings;
}

function shiftMonths(iso: string, deltaMonths: number): string {
  const date = new Date(iso);
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + deltaMonths,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  ).toISOString();
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** mulberry32: a small deterministic PRNG. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
