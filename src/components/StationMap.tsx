"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { CLASS_META, classifyBod } from "@/lib/classify";
import type { Station } from "@/types";
import type { StationMapProps } from "@/components/map-types";

const AHMEDABAD: [number, number] = [23.03, 72.58];

function FlyToSelected({
  stationId,
  lat,
  lng,
}: {
  stationId: string | null;
  lat: number | null;
  lng: number | null;
}) {
  const map = useMap();
  const hadSelection = useRef(false);

  useEffect(() => {
    if (stationId != null && lat != null && lng != null) {
      hadSelection.current = true;
      map.flyTo([lat, lng], Math.max(map.getZoom(), 13), { duration: 0.8 });
      return;
    }
    if (!hadSelection.current) return;
    hadSelection.current = false;
    map.flyTo(AHMEDABAD, 12, { duration: 0.8 });
  }, [stationId, lat, lng, map]);

  return null;
}

function markerStyle(station: Station, selected: boolean) {
  const lake = station.type === "lake";
  // Lakes are standing water, not points along the river. A larger radius
  // and a thicker dark stroke keep them distinct from river stations that
  // can share the same BOD color.
  const radius = (lake ? 14 : 10) + (selected ? 4 : 0);

  return {
    radius,
    pathOptions: {
      color: selected || lake ? "#0f172a" : "#ffffff",
      weight: selected ? 4 : lake ? 3 : 2,
      fillColor: CLASS_META[classifyBod(station.latest.bod)].color,
      fillOpacity: 0.95,
    },
  };
}

export default function StationMap({
  stations,
  selectedStationId,
  onSelect,
}: StationMapProps) {
  const selected = stations.find((station) => station.id === selectedStationId);
  const ordered = [...stations].sort((a, b) => {
    if (a.id === selectedStationId) return 1;
    if (b.id === selectedStationId) return -1;
    return 0;
  });

  return (
    <MapContainer
      center={AHMEDABAD}
      zoom={12}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected
        stationId={selected?.id ?? null}
        lat={selected?.lat ?? null}
        lng={selected?.lng ?? null}
      />
      {ordered.map((station) => {
        const selectedMarker = station.id === selectedStationId;
        const { radius, pathOptions } = markerStyle(station, selectedMarker);
        return (
          <CircleMarker
            key={station.id}
            center={[station.lat, station.lng]}
            radius={radius}
            pathOptions={pathOptions}
            eventHandlers={{
              click: () => onSelect(station.id),
            }}
          >
            <Tooltip>
              {station.name}
              <br />
              BOD {station.latest.bod} mg/L
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
