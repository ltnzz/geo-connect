import { auth } from '../config/firebaseAuth';

const proxyUrl = process.env.EXPO_PUBLIC_FOURSQUARE_WORKER_URL?.replace(/\/$/, '');

export const foursquareService = {
  async getNearbyPlaces(center, radiusMeters, query = '') {
    if (!proxyUrl) {
      throw new Error(
        'Foursquare proxy belum dikonfigurasi. Isi EXPO_PUBLIC_FOURSQUARE_WORKER_URL.',
      );
    }

    const idToken = await auth.currentUser?.getIdToken();

    if (!idToken) {
      throw new Error('Sign in before searching for nearby places.');
    }

    const response = await fetch(`${proxyUrl}/places/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMeters,
        query,
        limit: 25,
        sort: 'DISTANCE',
      }),
    });

    if (!response.ok) {
      throw new Error('Foursquare place search failed.');
    }

    const payload = await response.json();
    return Array.isArray(payload.places) ? payload.places : [];
  },
};
