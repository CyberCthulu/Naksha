// lib/geocode.ts
const OPENCAGE_KEY = process.env.EXPO_PUBLIC_OPENCAGE_KEY; // put key in app config

export type GeocodeResult = {
  name: string;        // "Redwood City, California, United States"
  lat: number;
  lon: number;
};

export async function geocodePlace(q: string): Promise<GeocodeResult[]> {
  if (!OPENCAGE_KEY) throw new Error('Missing OpenCage API key');
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(q)}&key=${OPENCAGE_KEY}&limit=5&no_annotations=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const json = await res.json();
  return (json.results || []).map((r: any) => ({
    name: r.formatted,
    lat: r.geometry.lat,
    lon: r.geometry.lng,
  }));
}
