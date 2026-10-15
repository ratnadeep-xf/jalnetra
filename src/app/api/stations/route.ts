import { stations } from "@/data/mockStations";

export function GET() {
  return Response.json(stations);
}
