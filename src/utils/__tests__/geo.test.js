import { createGeoPointData, getGeoQueryBounds, getDistanceMeters, blurCoordinate } from '../geo';

describe('geo Utils', () => {
  describe('createGeoPointData', () => {
    it('creates correct data for valid coordinates', () => {
      const data = createGeoPointData(-6.2, 106.8);
      expect(data.latitude).toBe(-6.2);
      expect(data.longitude).toBe(106.8);
      expect(typeof data.geohash).toBe('string');
      expect(data.geohash.length).toBeGreaterThan(0);
    });

    it('throws error for invalid latitude', () => {
      expect(() => createGeoPointData(100, 106.8)).toThrow();
    });

    it('throws error for invalid longitude', () => {
      expect(() => createGeoPointData(-6.2, 200)).toThrow();
    });
  });

  describe('getGeoQueryBounds', () => {
    it('returns an array of query bounds for valid inputs', () => {
      const bounds = getGeoQueryBounds(-6.2, 106.8, 1000);
      expect(Array.isArray(bounds)).toBe(true);
      expect(bounds.length).toBeGreaterThan(0);
      expect(Array.isArray(bounds[0])).toBe(true);
      expect(typeof bounds[0][0]).toBe('string');
      expect(typeof bounds[0][1]).toBe('string');
    });

    it('throws error for invalid radius', () => {
      expect(() => getGeoQueryBounds(-6.2, 106.8, -500)).toThrow();
    });
  });

  describe('getDistanceMeters', () => {
    it('calculates distance correctly', () => {
      
      const from = { latitude: -6.2088, longitude: 106.8456 }; 
      const to = { latitude: -6.4025, longitude: 106.7942 };   
      
      const dist = getDistanceMeters(from, to);
      expect(dist).toBeGreaterThan(20000); 
      expect(dist).toBeLessThan(25000);    
    });
    
    it('returns 0 for the same point', () => {
      const point = { latitude: -6.2, longitude: 106.8 };
      expect(getDistanceMeters(point, point)).toBeCloseTo(0);
    });
  });

  describe('blurCoordinate', () => {
    it('returns a coordinate within max radius', () => {
      const original = { latitude: -6.2, longitude: 106.8 };
      const radius = 500;
      const blurred = blurCoordinate(original, radius);
      
      expect(blurred.latitude).not.toBe(original.latitude);
      expect(blurred.longitude).not.toBe(original.longitude);
      
      const distance = getDistanceMeters(original, blurred);
      expect(distance).toBeLessThanOrEqual(radius + 1); 
    });

    it('throws error for invalid input coordinate', () => {
      expect(() => blurCoordinate({ latitude: 100, longitude: 100 })).toThrow();
    });
  });
});
