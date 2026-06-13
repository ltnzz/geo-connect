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

export const createGeoPointData = (latitude, longitude) => {
  assertCoordinate(latitude, 'latitude', -90, 90);
  assertCoordinate(longitude, 'longitude', -180, 180);

  return {
    latitude,
    longitude,
    geohash: geohashForLocation([latitude, longitude]),
  };
};

export const getGeoQueryBounds = (latitude, longitude, radiusMeters) => {
  assertCoordinate(latitude, 'latitude', -90, 90);
  assertCoordinate(longitude, 'longitude', -180, 180);

  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw new Error('radiusMeters must be greater than 0.');
  }

  return geohashQueryBounds([latitude, longitude], radiusMeters);
};

export const getDistanceMeters = (from, to) =>
  distanceBetween(
    [from.latitude, from.longitude],
    [to.latitude, to.longitude],
  ) * 1000;
