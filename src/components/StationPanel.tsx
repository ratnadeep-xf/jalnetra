import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, X } from "lucide-react";
import { CLASS_META, classifyBod } from "@/lib/classify";
import { getReadings } from "@/lib/api";
import type { PriorityClass, Reading, Station } from "@/types";

type Metric = "bod" | "do" | "ph" | "cod";

const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: "bod", label: "BOD", unit: "mg/L" },
  { id: "do", label: "DO", unit: "mg/L" },
  { id: "ph", label: "pH", unit: "pH" },
  { id: "cod", label: "COD", unit: "mg/L" },
];

type TrendDirection = "up" | "down" | "flat";

type BodTrend = {
  direction: TrendDirection;
  percent: number;
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "2-digit",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatUpdated(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

function formatMonth(iso: string): string {
  return monthFormatter.format(new Date(iso));
}

function textOn(hex: string): string {
  const value = Number.parseInt(hex.slice(1), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
}

function classTitle(priority: PriorityClass): string {
  if (priority === "Compliant") return "Compliant";
  return `Priority Class ${priority}`;
}

function classDescription(priority: PriorityClass): string {
  if (priority === "Compliant") {
    return "Within CPCB limit (BOD <= 3 mg/L)";
  }
  return CLASS_META[priority].description;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/** Latest BOD versus the mean of the three months before it. Rising BOD is worsening. */
function bodTrend(readings: Reading[]): BodTrend | null {
  if (readings.length < 4) return null;
  const latest = readings[readings.length - 1].bod;
  const previous = readings.slice(-4, -1);
  const average = previous.reduce((sum, reading) => sum + reading.bod, 0) / previous.length;
  if (average === 0) {
    return latest === 0
      ? { direction: "flat", percent: 0 }
      : { direction: "up", percent: 100 };
  }
  const percent = Math.round(((latest - average) / average) * 100);
  if (percent > 0) return { direction: "up", percent };
  if (percent < 0) return { direction: "down", percent };
  return { direction: "flat", percent: 0 };
}

function TrendIndicator({ trend }: { trend: BodTrend }) {
  const rising = trend.direction === "up";
  const falling = trend.direction === "down";
  const Icon = rising ? ArrowUp : falling ? ArrowDown : ArrowRight;
  const tone = rising
    ? "text-red-600"
    : falling
      ? "text-green-600"
      : "text-slate-500";
  const label = rising
    ? `BOD up ${trend.percent}% versus the previous 3 months`
    : falling
      ? `BOD down ${Math.abs(trend.percent)}% versus the previous 3 months`
      : "BOD unchanged versus the previous 3 months";
  const text = trend.percent > 0 ? `+${trend.percent}%` : `${trend.percent}%`;

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${tone}`} title={label}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">{label}. </span>
      {text}
    </span>
  );
}

function StatCard({
  label,
  value,
  unit,
  poor,
  trend,
  trendLoading = false,
}: {
  label: string;
  value: number;
  unit: string;
  poor: boolean;
  trend?: BodTrend | null;
  trendLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {trendLoading ? (
          <span className="mt-0.5 h-4 w-12 animate-pulse rounded bg-slate-200" />
        ) : trend ? (
          <TrendIndicator trend={trend} />
        ) : null}
      </div>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${poor ? "text-red-600" : "text-slate-900"}`}>
        {numberFormatter.format(value)}
        {unit ? (
          <span className="ml-1 text-xs font-normal text-slate-500">{unit}</span>
        ) : null}
      </p>
    </div>
  );
}

function TrendTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: unknown; payload?: unknown }>;
  unit: string;
}) {
  const point = payload?.[0];
  const raw = point?.payload;
  const date =
    raw != null && typeof raw === "object" && "date" in raw && typeof raw.date === "string"
      ? raw.date
      : null;
  if (!active || point == null || date == null) return null;
  const value = typeof point.value === "number" ? point.value : Number(point.value);
  if (!Number.isFinite(value)) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="text-slate-500">{formatUpdated(date)}</p>
      <p className="mt-0.5 font-semibold text-slate-900">
        {numberFormatter.format(value)} {unit}
      </p>
    </div>
  );
}

export default function StationPanel({
  station,
  onClose,
}: {
  station: Station;
  onClose: () => void;
}) {
  const [readings, setReadings] = useState<Reading[] | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [metric, setMetric] = useState<Metric>("bod");

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getReadings(station.id, controller.signal)
      .then((data) => {
        if (!active) return;
        setReadings(data);
        setLoadedFor(station.id);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (!active || isAbortError(caught)) return;
        setReadings(null);
        setLoadedFor(station.id);
        setError("Could not load the trend for this station.");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [station.id, attempt]);

  const priority = classifyBod(station.latest.bod);
  const meta = CLASS_META[priority];
  const current = loadedFor === station.id;
  const ready = current && readings !== null && error === null;
  const failed = current && error !== null;
  const trend = ready && readings ? bodTrend(readings) : null;
  const selectedMetric = METRICS.find((item) => item.id === metric) ?? METRICS[0];
  const series =
    ready && readings
      ? readings.map((reading) => ({
          date: reading.date,
          value: reading[metric],
        }))
      : [];
  const reference =
    metric === "bod" ? { y: 3, label: "CPCB limit" } : metric === "do" ? { y: 4, label: "Min. DO" } : null;
  const yDomain = yAxisDomain(
    series.map((point) => point.value),
    reference?.y ?? null,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {station.name}
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">{station.waterBody}</p>
          <span
            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              station.type === "lake"
                ? "bg-slate-100 text-slate-700"
                : "bg-sky-50 text-sky-800"
            }`}
          >
            {station.type === "lake" ? "Lake" : "River"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div className="flex flex-col gap-5 px-4 py-4">
        <div>
          <p
            className="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
            style={{ backgroundColor: meta.color, color: textOn(meta.color) }}
          >
            {classTitle(priority)}
          </p>
          <p className="mt-2 text-sm leading-snug text-slate-600">
            {classDescription(priority)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="BOD"
            value={station.latest.bod}
            unit="mg/L"
            poor={station.latest.bod > 3}
            trend={ready ? trend : null}
            trendLoading={!ready && !failed}
          />
          <StatCard
            label="DO"
            value={station.latest.do}
            unit="mg/L"
            poor={station.latest.do < 4}
          />
          <StatCard label="pH" value={station.latest.ph} unit="" poor={false} />
          <StatCard
            label="COD"
            value={station.latest.cod}
            unit="mg/L"
            poor={false}
          />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Monthly trend</h3>
          </div>
          <div
            className="mb-3 grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="Chart parameter"
          >
            {METRICS.map((item) => {
              const selected = item.id === metric;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMetric(item.id)}
                  className={`rounded-md px-2 py-1 text-xs font-medium ${
                    selected
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {!ready && !failed ? (
            <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
          ) : failed ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 px-4 text-center">
              <p className="text-sm text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadedFor(null);
                  setError(null);
                  setAttempt((value) => value + 1);
                }}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={series}
                  margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    domain={yDomain}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    label={{
                      value: selectedMetric.unit,
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#64748b", fontSize: 11 },
                    }}
                  />
                  <Tooltip
                    content={(props) => (
                      <TrendTooltip
                        active={props.active}
                        payload={props.payload}
                        unit={selectedMetric.unit}
                      />
                    )}
                  />
                  {reference ? (
                    <ReferenceLine
                      y={reference.y}
                      stroke="#dc2626"
                      strokeDasharray="4 4"
                      label={{
                        value: reference.label,
                        fill: "#dc2626",
                        fontSize: 11,
                        position: "insideTopRight",
                      }}
                    />
                  ) : null}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: "#0284c7" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <footer className="border-t border-slate-200 pt-3 text-xs text-slate-500">
          <p>
            Source: {station.source} - Last updated {formatUpdated(station.latest.date)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Mock data</p>
        </footer>
      </div>
    </div>
  );
}

function yAxisDomain(values: number[], reference: number | null): [number, number] {
  const points = reference == null ? values : [...values, reference];
  if (points.length === 0) return [0, 1];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const pad = Math.max((max - min) * 0.12, 0.4);
  return [Math.max(0, Math.floor((min - pad) * 10) / 10), Math.ceil((max + pad) * 10) / 10];
}
