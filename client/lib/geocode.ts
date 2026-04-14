// lib/geocode.ts
const OPENCAGE_KEY = process.env.EXPO_PUBLIC_OPENCAGE_KEY?.trim(); // put key in app config

export type GeocodeResult = {
  name: string; // "Redwood City, California, United States"
  lat: number;
  lon: number;
};

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
  )}&key=${OPENCAGE_KEY}&limit=5&no_annotations=1`;

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

  return (json.results || []).map((r: any) => ({
    name: r.formatted,
    lat: r.geometry.lat,
    lon: r.geometry.lng,
  }));
}
