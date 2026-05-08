// lib/geocode.ts
const OPENCAGE_KEY = process.env.EXPO_PUBLIC_OPENCAGE_KEY?.trim(); // put key in app config

export type GeocodeResult = {
  name: string; // "Redwood City, California, United States"
  lat: number;
  lon: number;
  timeZone?: string | null;
};

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildGeocodeError(status: number, statusText: string, message?: string): string {
  if (status === 401) {
    return `Geocode failed: 401 Unauthorized. Verify EXPO_PUBLIC_OPENCAGE_KEY is valid and active${
      message ? ` (${message})` : ''
    }`;
  }

  return `Geocode failed: ${status}${statusText ? ` ${statusText}` : ''}${
    message ? ` (${message})` : ''
  }`;
}

export async function geocodePlace(q: string): Promise<GeocodeResult[]> {
  if (!OPENCAGE_KEY) throw new Error('Missing OpenCage API key');

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    q,
  )}&key=${OPENCAGE_KEY}&limit=5`;

  const res = await fetch(url);

  if (!res.ok) {
    let apiMessage: string | undefined;

    try {
      const json = await res.json();
      if (json?.status?.message && typeof json.status.message === 'string') {
        apiMessage = json.status.message;
      }
    } catch {
      // ignore parse errors and fall back to status code text
    }

    throw new Error(buildGeocodeError(res.status, res.statusText, apiMessage));
  }

  const json = await res.json();
  const results: any[] = Array.isArray(json.results) ? json.results : [];

  return results.reduce<GeocodeResult[]>((acc, r: any) => {
    const lat = toFiniteNumber(r?.geometry?.lat);
    const lon = toFiniteNumber(r?.geometry?.lng);
    const name = typeof r?.formatted === 'string' ? r.formatted : '';

    if (!name || lat == null || lon == null) return acc;

    const timeZone =
      typeof r?.annotations?.timezone?.name === 'string'
        ? r.annotations.timezone.name
        : null;

    acc.push({ name, lat, lon, timeZone });
    return acc;
  }, []);
}
