import { createHash, randomUUID } from "node:crypto";

export interface RoofMeasurement {
  measurementId: string;
  address: string;
  lat: number;
  lng: number;
  totalRoofAreaSqft: number;
  squares: number;
  predominantPitch: "low" | "medium" | "steep";
  ridgeLinearFeet: number;
  hipLinearFeet: number;
  valleyLinearFeet: number;
  eaveLinearFeet: number;
  rakeLinearFeet: number;
  facetCount: number;
  storyCount: 1 | 2 | 3;
  confidence: number;
  source: "google_earth_mock";
  capturedAt: string;
}

// TODO: replace with a real call to Google Earth's Solar API, Nearmap, or
// EagleView. Today this synthesizes a measurement deterministically from the
// address so quotes stay stable when an operator re-runs the same property.
export async function measureRoofFromAddress(
  address: string,
): Promise<RoofMeasurement> {
  const seed = hashToInt(address);
  const rng = mulberry32(seed);

  const baseAreaSqft = 1400 + Math.floor(rng() * 2600);
  const wasteFactor = 1.0 + rng() * 0.08;
  const totalRoofAreaSqft = Math.round(baseAreaSqft * wasteFactor);
  const squares = Math.round((totalRoofAreaSqft / 100) * 10) / 10;

  const facetCount = 4 + Math.floor(rng() * 6);
  const perimeter = Math.sqrt(totalRoofAreaSqft) * 4 * (1 + rng() * 0.2);

  const ridge = Math.round(perimeter * (0.18 + rng() * 0.07));
  const hip = Math.round(perimeter * (0.08 + rng() * 0.05));
  const valley = Math.round(perimeter * (0.05 + rng() * 0.06));
  const eave = Math.round(perimeter * (0.32 + rng() * 0.05));
  const rake = Math.round(perimeter * (0.22 + rng() * 0.05));

  const pitchRoll = rng();
  const pitch: RoofMeasurement["predominantPitch"] =
    pitchRoll < 0.25 ? "low" : pitchRoll < 0.8 ? "medium" : "steep";
  const stories = (rng() < 0.55 ? 1 : rng() < 0.92 ? 2 : 3) as 1 | 2 | 3;

  const { lat, lng } = pseudoGeocode(address, rng);

  return {
    measurementId: randomUUID(),
    address,
    lat,
    lng,
    totalRoofAreaSqft,
    squares,
    predominantPitch: pitch,
    ridgeLinearFeet: ridge,
    hipLinearFeet: hip,
    valleyLinearFeet: valley,
    eaveLinearFeet: eave,
    rakeLinearFeet: rake,
    facetCount,
    storyCount: stories,
    confidence: Math.round((0.78 + rng() * 0.18) * 100) / 100,
    source: "google_earth_mock",
    capturedAt: new Date().toISOString(),
  };
}

function hashToInt(s: string): number {
  const h = createHash("sha256").update(s.trim().toLowerCase()).digest();
  return h.readUInt32BE(0);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pseudoGeocode(address: string, rng: () => number): { lat: number; lng: number } {
  // Center somewhere in the continental US so the numbers look plausible.
  const lat = 37 + (rng() - 0.5) * 8;
  const lng = -95 + (rng() - 0.5) * 30;
  void address;
  return { lat: round6(lat), lng: round6(lng) };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
