import Constants from 'expo-constants';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey;
const BASE = 'https://maps.googleapis.com/maps/api';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

function hasRealGoogleApiKey() {
  return !!GOOGLE_API_KEY && !GOOGLE_API_KEY.startsWith('YOUR_');
}

async function fetchGoogleRoute(points) {
  const origin = `${points[0].lat},${points[0].lng}`;
  const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;
  const waypoints = points
    .slice(1, -1)
    .map((p) => `${p.lat},${p.lng}`)
    .join('|');

  const url =
    `${BASE}/directions/json?origin=${origin}&destination=${destination}` +
    (waypoints ? `&waypoints=${waypoints}` : '') +
    `&mode=driving&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Directions request failed with status ${res.status}`);

  const data = await res.json();
  if (data.status !== 'OK' || !data.routes?.length) {
    throw new Error('Directions API returned no route');
  }

  return data;
}

async function fetchOsrmRoute(points) {
  const coordinates = points.map((point) => `${point.lng},${point.lat}`).join(';');
  const url = `${OSRM_BASE}/${coordinates}?overview=full&geometries=polyline&steps=false&alternatives=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM request failed with status ${res.status}`);

  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length || !data.routes[0]?.geometry) {
    throw new Error('OSRM returned no route');
  }

  return {
    routes: [
      {
        overview_polyline: {
          points: data.routes[0].geometry,
        },
      },
    ],
  };
}

export async function getRoute(points) {
  if (!points || points.length < 2) throw new Error('Need at least 2 points');
  if (hasRealGoogleApiKey()) {
    try {
      return await fetchGoogleRoute(points);
    } catch (error) {
      console.warn('[maps] Google Directions failed, fallback to OSRM:', error?.message || error);
    }
  }

  return fetchOsrmRoute(points);
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
