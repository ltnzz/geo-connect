const getGridCoordinate = (value, origin, span, size) =>
  Math.floor(((value - origin) / span) * size);

export const clusterMapItems = (
  items,
  region,
  viewport,
  cellSize = 64,
) => {
  if (!region || !viewport.width || !viewport.height) {
    return items.map((item) => ({
      id: item.id,
      coordinate: item.coordinate,
      items: [item],
    }));
  }

  const latitudeSpan = Math.max(region.latitudeDelta, 0.0001);
  const longitudeSpan = Math.max(region.longitudeDelta, 0.0001);
  const latitudeOrigin = region.latitude - latitudeSpan / 2;
  const longitudeOrigin = region.longitude - longitudeSpan / 2;
  const columns = Math.max(1, viewport.width / cellSize);
  const rows = Math.max(1, viewport.height / cellSize);
  const groups = new Map();

  items.forEach((item) => {
    const column = getGridCoordinate(
      item.coordinate.longitude,
      longitudeOrigin,
      longitudeSpan,
      columns,
    );
    const row = getGridCoordinate(
      item.coordinate.latitude,
      latitudeOrigin,
      latitudeSpan,
      rows,
    );
    const key = `${column}:${row}`;
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  });

  return [...groups.entries()].map(([key, group]) => ({
    id: group.length === 1 ? group[0].id : `cluster-${key}`,
    coordinate: {
      latitude:
        group.reduce((sum, item) => sum + item.coordinate.latitude, 0) /
        group.length,
      longitude:
        group.reduce((sum, item) => sum + item.coordinate.longitude, 0) /
        group.length,
    },
    items: group,
  }));
};
