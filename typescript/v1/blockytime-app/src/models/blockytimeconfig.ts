
export type TimePrecision = "ROUGH" | "HALF_HOUR" | "QUARTER_HOUR";
export interface BlockyTimeConfig {
    mainTimePrecision: TimePrecision;
    disablePixelate: boolean;
    specialTimePeriod: [number, number][];
}

