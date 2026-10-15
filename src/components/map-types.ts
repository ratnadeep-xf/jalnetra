import type { Station } from "@/types";

export type StationMapProps = {
  stations: Station[];
  selectedStationId: string | null;
  onSelect: (stationId: string) => void;
};
