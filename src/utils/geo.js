import {
  distanceBetween,
  geohashForLocation,
  geohashQueryBounds,
} from 'geofire-common';

const assertCoordinate = (value, name, min, max) => {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}.`);
  }
};

/**
 * Creates geographical point data including the latitude, longitude, and its computed Geohash.
 * 
 * @param {number} latitude - The latitude coordinate (-90 to 90).
 * @param {number} longitude - The longitude coordinate (-180 to 180).
 * @returns {{latitude: number, longitude: number, geohash: string}} An object containing the coordinates and geohash.
 * @throws {Error} If latitude or longitude is out of valid bounds.
 */
export const createGeoPointData = (latitude, longitude) => {
  assertCoordinate(latitude, 'latitude', -90, 90);
  assertCoordinate(longitude, 'longitude', -180, 180);

  return {
    latitude,
    longitude,
    geohash: geohashForLocation([latitude, longitude]),
  };
};

/**
 * Calculates the Geohash query bounds for a given center and radius.
 * 
 * @param {number} latitude - The center latitude.
 * @param {number} longitude - The center longitude.
 * @param {number} radiusMeters - The radius in meters to query.
 * @returns {Array<Array<string>>} An array of start and end Geohash strings representing the query bounds.
 * @throws {Error} If radius is invalid or coordinates are out of bounds.
 */
export const getGeoQueryBounds = (latitude, longitude, radiusMeters) => {
  assertCoordinate(latitude, 'latitude', -90, 90);
  assertCoordinate(longitude, 'longitude', -180, 180);

  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new Error('radiusMeters must be greater than 0.');
  }

  return geohashQueryBounds([latitude, longitude], radiusMeters);
};

/**
 * Calculates the exact distance in meters between two geographical points using the Haversine formula.
 * 
 * @param {{latitude: number, longitude: number}} from - The starting coordinate.
 * @param {{latitude: number, longitude: number}} to - The destination coordinate.
 * @returns {number} The distance in meters.
 */
export const getDistanceMeters = (from, to) =>
  distanceBetween(
    [from.latitude, from.longitude],
    [to.latitude, to.longitude],
  ) * 1000;

/**
 * Blurs (randomizes) a geographical coordinate within a specified radius.
 * Useful for privacy controls like "Neighborhood Only".
 * 
 * @param {{latitude: number, longitude: number}} coordinate - The exact coordinate to blur.
 * @param {number} [maxRadiusMeters=500] - The maximum distance in meters to offset the coordinate.
 * @returns {{latitude: number, longitude: number}} The new, blurred coordinate.
 * @throws {Error} If the input coordinate is out of valid bounds.
 */
export const blurCoordinate = (
  { latitude, longitude },
  maxRadiusMeters = 500,
) => {
  assertCoordinate(latitude, 'latitude', -90, 90);
  assertCoordinate(longitude, 'longitude', -180, 180);

  const distance = Math.sqrt(Math.random()) * maxRadiusMeters;
  const angle = Math.random() * Math.PI * 2;
  const latitudeOffset = (distance * Math.cos(angle)) / 111320;
  const longitudeScale = Math.max(
    Math.cos((latitude * Math.PI) / 180),
    0.01,
  );
  const longitudeOffset =
    (distance * Math.sin(angle)) / (111320 * longitudeScale);

  return {
    latitude: latitude + latitudeOffset,
    longitude: longitude + longitudeOffset,
  };
};
