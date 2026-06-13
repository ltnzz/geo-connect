import {
  collection,
  documentId,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
  where,
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { getDistanceMeters, getGeoQueryBounds } from '../utils/geo';

export const getNearbyDocuments = async ({
  collectionName,
  center,
  radiusMeters,
  locationField = 'location',
  maxResults = 50,
}) => {
  const bounds = getGeoQueryBounds(center.latitude, center.longitude, radiusMeters);
  const snapshots = await Promise.all(
    bounds.map(([start, end]) =>
      getDocs(
        query(
          collection(db, collectionName),
          orderBy(`${locationField}.geohash`),
          startAt(start),
          endAt(end),
          limit(maxResults),
        ),
      ),
    ),
  );

  const candidates = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((document) => {
      candidates.set(document.id, document);
    });
  });

  return [...candidates.values()]
    .map((document) => {
      const data = document.data();
      const location = data[locationField];

      if (!location) {
        return null;
      }

      const distanceMeters = getDistanceMeters(center, location);

      return distanceMeters <= radiusMeters
        ? {
            id: document.id,
            ...data,
            distanceMeters,
          }
        : null;
    })
    .filter(Boolean)
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .slice(0, maxResults);
};

export const getDocumentsByIds = async (collectionName, ids) => {
  if (!ids.length) {
    return [];
  }

  const chunks = [];
  for (let index = 0; index < ids.length; index += 30) {
    chunks.push(ids.slice(index, index + 30));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) =>
      getDocs(
        query(collection(db, collectionName), where(documentId(), 'in', chunk)),
      ),
    ),
  );

  return snapshots.flatMap((snapshot) =>
    snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })),
  );
};
