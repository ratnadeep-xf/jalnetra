import { generateReadings } from "@/data/mockReadings";
import { stations } from "@/data/mockStations";

export function generateStaticParams() {
  return stations.map((station) => ({ id: station.id }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const station = stations.find((item) => item.id === id);

  if (!station) {
    return Response.json({ error: "Station not found" }, { status: 404 });
  }

  return Response.json(generateReadings(station));
}
