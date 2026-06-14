const FOURSQUARE_API_VERSION = '2025-06-17';
const CORS_HEADERS = {
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });

const getBearerToken = (request) => {
  const authorization = request.headers.get('Authorization') || '';
  return authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';
};

const verifyFirebaseToken = async (idToken, apiKey) => {
  if (!idToken || !apiKey) {
    return false;
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(
      apiKey,
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  );

  return response.ok;
};

const getPlaceAddress = (location = {}) =>
  [
    location.address,
    location.locality,
    location.region,
    location.postcode,
  ]
    .filter(Boolean)
    .join(', ');

const normalizePlace = (place) => ({
  id: place.fsq_place_id,
  name: place.name,
  category: place.categories?.[0]?.name || 'Place',
  address: getPlaceAddress(place.location),
  distance: Number.isFinite(place.distance) ? place.distance : null,
  link: place.link || null,
  location: {
    latitude: place.latitude,
    longitude: place.longitude,
  },
});

const searchPlaces = async (request, env) => {
  const idToken = getBearerToken(request);
  const isAuthenticated = await verifyFirebaseToken(
    idToken,
    env.FIREBASE_WEB_API_KEY,
  );

  if (!isAuthenticated) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return jsonResponse({ error: 'Invalid coordinates' }, 400);
  }

  const radius = Math.min(
    Math.max(Number(body.radiusMeters) || 5000, 100),
    25000,
  );
  const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 25);
  const query =
    typeof body.query === 'string' ? body.query.trim().slice(0, 80) : '';
  const parameters = new URLSearchParams({
    ll: `${latitude},${longitude}`,
    radius: String(radius),
    limit: String(limit),
    sort: 'DISTANCE',
    fields:
      'fsq_place_id,name,categories,location,latitude,longitude,distance,link',
  });

  if (query) {
    parameters.set('query', query);
  }

  const response = await fetch(
    `https://places-api.foursquare.com/places/search?${parameters}`,
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${env.FOURSQUARE_API_KEY}`,
        'X-Places-Api-Version': FOURSQUARE_API_VERSION,
      },
    },
  );

  if (!response.ok) {
    return jsonResponse(
      {
        error:
          response.status === 429
            ? 'Foursquare rate limit reached'
            : 'Foursquare request failed',
      },
      response.status === 429 ? 429 : 502,
    );
  }

  const payload = await response.json();
  const places = Array.isArray(payload.results) ? payload.results : [];

  return jsonResponse({
    attribution: 'Foursquare',
    places: places
      .filter(
        (place) =>
          place.fsq_place_id &&
          place.name &&
          Number.isFinite(place.latitude) &&
          Number.isFinite(place.longitude),
      )
      .map(normalizePlace),
  });
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ ok: true });
    }

    if (request.method === 'POST' && url.pathname === '/places/search') {
      return searchPlaces(request, env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  },
};
