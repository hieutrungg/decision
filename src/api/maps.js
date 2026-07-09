import Constants from 'expo-constants';

const API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
const BASE = 'https://maps.googleapis.com/maps/api';

export async function getRoute(points) {
  if (!points || points.length < 2) throw new Error('Need at least 2 points');
  if (!API_KEY) throw new Error('Missing Google Maps API key');

  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const waypoints = points
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join('|');

  const url =
    `${BASE}/directions/json?origin=${origin}&destination=${destination}` +
    (waypoints ? `&waypoints=${waypoints}` : '') +
    `&mode=driving&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions request failed with status ${res.status}`);

  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) {
    throw new Error('Directions API returned no route');
  }

  return data;
}

export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
