/** River or standing urban water body. */
export type WaterBodyType = "river" | "lake";

/**
 * CPCB polluted-stretch priority, plus Compliant when BOD is at or below 3 mg/L.
 */
export type PriorityClass = "I" | "II" | "III" | "IV" | "V" | "Compliant";

/**
 * One water-quality sample.
 * `bod`, `do`, and `cod` are mg/L. `ph` is unitless.
 */
export type Reading = {
  /** ISO 8601 timestamp. */
  date: string;
  /** Biochemical oxygen demand, mg/L. */
  bod: number;
  /** Dissolved oxygen, mg/L. */
  do: number;
  /** pH. */
  ph: number;
  /** Chemical oxygen demand, mg/L. */
  cod: number;
};

/** A monitoring station on the Sabarmati or an Ahmedabad lake. */
export type Station = {
  id: string;
  name: string;
  /** Water body name, e.g. "Sabarmati River". */
  waterBody: string;
  type: WaterBodyType;
  lat: number;
  lng: number;
  /** Monitoring agency, e.g. "CPCB", "GPCB", "AMC". */
  source: string;
  latest: Reading;
};
