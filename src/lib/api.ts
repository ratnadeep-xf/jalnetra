import type { Reading, Station } from "@/types";

/**
 * These are the only two functions to change when the real backend is ready
 * (e.g. swap to process.env.NEXT_PUBLIC_API_URL).
 */

export async function getStations(): Promise<Station[]> {
  const response = await fetch("/api/stations");
  if (!response.ok) {
    throw new Error(`Failed to load stations (${response.status})`);
  }
  return (await response.json()) as Station[];
}

export async function getReadings(
  stationId: string,
  signal?: AbortSignal,
): Promise<Reading[]> {
  const response = await fetch(
    `/api/stations/${encodeURIComponent(stationId)}/readings`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Failed to load readings (${response.status})`);
  }
  return (await response.json()) as Reading[];
}
