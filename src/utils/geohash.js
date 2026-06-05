export function createGeohashPlaceholder(latitude, longitude) {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}
