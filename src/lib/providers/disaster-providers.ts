// DisasterGuard — Modular Disaster Data Provider architecture.
//
// This module defines the contract every real-world data feed must implement.
// Today all providers run in MOCK mode. To go live, implement the same
// `DisasterDataProvider` interface against a real API (e.g. IMD, USGS, INCOIS,
// CWC river gauges, satellite feeds) and flip `kind` to LIVE in ProviderFeed.

export interface ProviderObservation {
  providerKey: string;
  providerName: string;
  kind: "MOCK" | "LIVE";
  observedAt: string; // ISO timestamp
  metric: string; // e.g. "rainfall_mm", "river_level_m", "magnitude", "wind_kph"
  value: number;
  unit: string;
  locationName: string;
  /** VERIFIED_DATA = from a real feed, MODEL = derived, DEMO = simulated */
  dataBasis: "VERIFIED_DATA" | "MODEL" | "DEMO";
  note?: string;
}

export interface DisasterDataProvider {
  readonly key: string;
  readonly name: string;
  readonly kind: "MOCK" | "LIVE";
  /** Return the latest observations for a location. */
  fetchObservations(locationName: string): Promise<ProviderObservation[]>;
  health(): Promise<{ status: "HEALTHY" | "DEGRADED" | "OFFLINE"; detail: string }>;
}

// ---------------------------------------------------------------- utilities
function seededRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

// ------------------------------------------------- WeatherProvider (mock)
export class WeatherProvider implements DisasterDataProvider {
  readonly key = "WEATHER";
  readonly name = "WeatherProvider (Mock IMD Feed)";
  readonly kind = "MOCK" as const;

  async fetchObservations(locationName: string): Promise<ProviderObservation[]> {
    const rnd = seededRandom(`${this.key}:${locationName}:${new Date().toISOString().slice(0, 10)}`);
    return [
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "rainfall_24h", value: round(rnd() * 180), unit: "mm",
        locationName, dataBasis: "DEMO",
        note: "Simulated rainfall reading — connect a live weather API (e.g. IMD/OpenWeatherMap) via WEATHER_API_KEY to replace this.",
      },
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "wind_speed", value: round(rnd() * 80), unit: "km/h",
        locationName, dataBasis: "DEMO",
      },
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "temperature", value: round(24 + rnd() * 24), unit: "°C",
        locationName, dataBasis: "DEMO",
      },
    ];
  }

  async health() {
    return { status: "HEALTHY" as const, detail: "Mock provider — always healthy" };
  }
}

// --------------------------------------------- EarthquakeProvider (mock)
export class EarthquakeProvider implements DisasterDataProvider {
  readonly key = "EARTHQUAKE";
  readonly name = "EarthquakeProvider (Mock Seismic Feed)";
  readonly kind = "MOCK" as const;

  async fetchObservations(locationName: string): Promise<ProviderObservation[]> {
    const rnd = seededRandom(`${this.key}:${locationName}:${new Date().toISOString().slice(0, 12)}`);
    return [
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "last_magnitude", value: round(rnd() * 3.4 + 0.8), unit: "Mw",
        locationName, dataBasis: "DEMO",
        note: "Simulated seismic reading — point at USGS / INCOIS feed to go live.",
      },
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "tremor_frequency", value: round(rnd() * 12), unit: "events/24h",
        locationName, dataBasis: "DEMO",
      },
    ];
  }

  async health() {
    return { status: "HEALTHY" as const, detail: "Mock provider — always healthy" };
  }
}

// ---------------------------------------------------- FloodProvider (mock)
export class FloodProvider implements DisasterDataProvider {
  readonly key = "FLOOD";
  readonly name = "FloodProvider (Mock River-Gauge / IoT)";
  readonly kind = "MOCK" as const;

  async fetchObservations(locationName: string): Promise<ProviderObservation[]> {
    const rnd = seededRandom(`${this.key}:${locationName}:${new Date().toISOString().slice(0, 12)}`);
    return [
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "river_level", value: round(rnd() * 6 + 2), unit: "m",
        locationName, dataBasis: "DEMO",
        note: "Simulated river-gauge sensor — connect CWC / IoT LoRaWAN sensors to go live.",
      },
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "soil_saturation", value: round(rnd() * 100), unit: "%",
        locationName, dataBasis: "DEMO",
      },
    ];
  }

  async health() {
    return { status: "HEALTHY" as const, detail: "Mock provider — always healthy" };
  }
}

// ------------------------------------------------ SatelliteProvider (mock)
export class SatelliteProvider implements DisasterDataProvider {
  readonly key = "SATELLITE";
  readonly name = "SatelliteProvider (Mock Imagery/Radar)";
  readonly kind = "MOCK" as const;

  async fetchObservations(locationName: string): Promise<ProviderObservation[]> {
    const rnd = seededRandom(`${this.key}:${locationName}:${new Date().toISOString().slice(0, 10)}`);
    return [
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "cloud_cover", value: round(rnd() * 100), unit: "%",
        locationName, dataBasis: "DEMO",
        note: "Simulated satellite/radar index — connect weather-radar or satellite imagery APIs to go live.",
      },
      {
        providerKey: this.key, providerName: this.name, kind: this.kind,
        observedAt: new Date().toISOString(),
        metric: "vegetation_dryness", value: round(rnd() * 100), unit: "index",
        locationName, dataBasis: "DEMO",
      },
    ];
  }

  async health() {
    return { status: "HEALTHY" as const, detail: "Mock provider — always healthy" };
  }
}

// ----------------------------------------------------------- registry
export function getAllProviders(): DisasterDataProvider[] {
  return [
    new WeatherProvider(),
    new EarthquakeProvider(),
    new FloodProvider(),
    new SatelliteProvider(),
  ];
}

export function getProvider(key: string): DisasterDataProvider | undefined {
  return getAllProviders().find((p) => p.key === key);
}
