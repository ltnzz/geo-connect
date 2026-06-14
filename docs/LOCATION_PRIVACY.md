# Location Privacy Trade-offs

AroundU keeps location features off by default. The Explore Map asks for
foreground permission only after the user explicitly enables nearby discovery.
It does not start background tracking.

## Precision Options

| Mode | Published data | Discovery quality | Privacy |
| --- | --- | --- | --- |
| Exact | Coordinate and GeoHash | Best for precise venue and radius results | Lowest |
| Neighborhood | Randomized coordinate within 500 m and its GeoHash | Useful for approximate nearby discovery | Medium |
| City only | City/address label without coordinates | Available for city feeds, not precise radius queries | High |
| Hidden | No public coordinates | Not discoverable on the map | Highest |

The exact device position used to center Explore Map remains on the device.
AroundU only writes a private location document when a feature explicitly calls
`updatePrivateLocation`. Firestore rules restrict that document to its owner.

## Battery Trade-off

Explore Map requests one foreground location fix. It first accepts a recent
last-known position and otherwise requests balanced accuracy. AroundU does not
use `watchPositionAsync` or background location for ordinary discovery, avoiding
continuous GPS usage.

Background location should only be introduced for a clearly explained feature,
requested separately, and configured with distance/time thresholds. It must
never be enabled as a side effect of opening the map.

## GeoHash Limitation

GeoHash bounds return rectangular candidates and can include false positives.
AroundU calculates the exact distance after each query and removes documents
outside the selected radius. City-only and hidden posts intentionally have no
GeoHash, so they cannot appear in precise radius searches.
