export type Coord = { lat: number; lon: number };

export interface SiteLike {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
  lat?: number;
  lon?: number;
}

export function isUsZip(s: string): boolean {
  return /^\d{5}$/.test(s.trim());
}

// Great-circle distance in miles.
export function haversineMiles(a: Coord, b: Coord): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Nearest site that has coordinates. Recruiting sites win ties/are preferred slightly.
export function nearestSite(user: Coord, locations: SiteLike[]): { location: SiteLike; miles: number } | null {
  let best: SiteLike | null = null;
  let bestMiles = Infinity;
  for (const loc of locations) {
    if (typeof loc.lat !== "number" || typeof loc.lon !== "number") continue;
    const miles = haversineMiles(user, { lat: loc.lat, lon: loc.lon });
    const recruiting = (loc.status ?? "").toUpperCase().includes("RECRUITING");
    const effective = recruiting ? miles - 0.01 : miles; // tiny nudge toward recruiting
    if (effective < bestMiles) {
      bestMiles = effective;
      best = loc;
    }
  }
  return best ? { location: best, miles: Math.round(bestMiles) } : null;
}

// Free, no-key US ZIP -> coordinates (client-side).
export async function geocodeUsZip(zip: string): Promise<Coord | null> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip.trim()}`);
    if (!r.ok) return null;
    const d: any = await r.json();
    const p = d?.places?.[0];
    if (!p) return null;
    const lat = parseFloat(p.latitude);
    const lon = parseFloat(p.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}
