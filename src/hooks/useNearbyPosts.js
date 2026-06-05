import { useMemo } from 'react';
import { getDistanceInKm } from '../utils/distance';

export function useNearbyPosts(posts, currentLocation, radiusKm = 5) {
  return useMemo(() => {
    if (!currentLocation) {
      return [];
    }

    const origin = currentLocation.coords ?? currentLocation;

    return posts.filter((post) => {
      if (!post.location) {
        return false;
      }

      return getDistanceInKm(origin, post.location) <= radiusKm;
    });
  }, [currentLocation, posts, radiusKm]);
}
