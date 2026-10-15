"use client";

import dynamic from "next/dynamic";
import Dashboard from "@/components/Dashboard";
import { Spinner } from "@/components/Spinner";

// Leaflet reads `window`, so this map never renders on the server.
const StationMap = dynamic(() => import("@/components/StationMap"), {
  ssr: false,
  loading: () => <Spinner label="Loading map" />,
});

export default function Home() {
  return <Dashboard Map={StationMap} />;
}
