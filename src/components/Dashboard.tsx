import { useEffect, useState, type ComponentType } from "react";
import { getStations } from "@/lib/api";
import type { Station } from "@/types";
import type { StationMapProps } from "@/components/map-types";
import { Header } from "@/components/Header";
import { Legend } from "@/components/Legend";
import { Spinner } from "@/components/Spinner";
import StationPanel from "@/components/StationPanel";

export default function Dashboard({
  Map,
}: {
  Map: ComponentType<StationMapProps>;
}) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null,
  );
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let active = true;

    getStations()
      .then((data) => {
        if (!active) return;
        setStations(data);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setStations([]);
        setError("Could not load monitoring stations.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [requestId]);

  function retry() {
    setLoading(true);
    setError(null);
    setRequestId((current) => current + 1);
  }

  const selectedStation =
    stations.find((station) => station.id === selectedStationId) ?? null;
  const panelOpen = selectedStation !== null;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100 text-slate-900">
      <Header />
      <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <section className="relative min-h-0 flex-1 bg-slate-100">
          <div className="absolute inset-0 z-0">
            {loading ? (
              <Spinner label="Loading stations" />
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-sm text-slate-600">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  Retry
                </button>
              </div>
            ) : (
              <Map
                stations={stations}
                selectedStationId={selectedStationId}
                onSelect={setSelectedStationId}
              />
            )}
          </div>
          {!loading && !error ? <Legend /> : null}
        </section>
        <aside
          className={`flex min-h-0 flex-col overflow-hidden border-slate-200 bg-white md:h-full md:w-[400px] md:shrink-0 md:border-l md:shadow-sm max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:z-[1100] max-md:h-[60vh] max-md:rounded-t-2xl max-md:border-t max-md:shadow-[0_-12px_32px_rgba(15,23,42,0.12)] max-md:transition-transform max-md:duration-300 max-md:ease-out ${
            panelOpen
              ? "max-md:translate-y-0"
              : "max-md:pointer-events-none max-md:translate-y-full"
          }`}
        >
          <div
            className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 md:hidden"
            aria-hidden="true"
          />
          {selectedStation ? (
            <StationPanel
              station={selectedStation}
              onClose={() => setSelectedStationId(null)}
            />
          ) : (
            <div className="hidden min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-slate-500 md:flex">
              Select a station on the map
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
