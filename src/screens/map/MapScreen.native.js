import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import {
  DEFAULT_MAP_CENTER,
  MAP_DISCOVERY_ITEMS,
} from '../../data/mapDiscoveryData';
import { foursquareService } from '../../services/foursquareService';
import { firestoreService } from '../../services/firestoreService';
import { locationService } from '../../services/locationService';
import { getDistanceMeters } from '../../utils/geo';
import { clusterMapItems } from '../../utils/mapCluster';
import { colors, radius, spacing } from '../../utils/theme';

import MapView, { Callout, Marker } from 'react-native-maps';

const INITIAL_REGION = {
  ...DEFAULT_MAP_CENTER,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: 'City', value: 25000 },
];

const TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Posts', value: 'post' },
  { label: 'Places', value: 'place' },
  { label: 'Events', value: 'event' },
];

const TYPE_META = {
  post: { color: colors.primary, icon: 'images' },
  place: { color: colors.secondary, icon: 'storefront' },
  event: { color: '#7C3AED', icon: 'calendar' },
};

const normalizeDocument = (document, type) => ({
  id: document.id,
  type,
  title:
    document.title ||
    document.name ||
    document.caption ||
    `${type[0].toUpperCase()}${type.slice(1)} around you`,
  subtitle:
    document.location?.address ||
    document.address ||
    document.city ||
    document.category ||
    'Nearby',
  coordinate: {
    latitude: document.location.latitude,
    longitude: document.location.longitude,
  },
});

const getDemoItems = (center, radiusMeters) => {
  const nearby = MAP_DISCOVERY_ITEMS.filter(
    (item) => getDistanceMeters(center, item.coordinate) <= radiusMeters,
  );

  return nearby.length ? nearby : MAP_DISCOVERY_ITEMS;
};

function DiscoveryMarker({ cluster, onPress }) {
  const isCluster = cluster.items.length > 1;
  const item = cluster.items[0];
  const meta = TYPE_META[item.type];

  return (
    <Marker coordinate={cluster.coordinate} onPress={() => onPress(cluster)}>
      <View
        style={[
          styles.marker,
          { backgroundColor: isCluster ? '#172033' : meta.color },
          isCluster && styles.clusterMarker,
        ]}
      >
        {isCluster ? (
          <Text style={styles.clusterCount}>{cluster.items.length}</Text>
        ) : (
          <Ionicons color="#FFFFFF" name={meta.icon} size={17} />
        )}
      </View>
      {!isCluster ? (
        <Callout>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>{item.title}</Text>
            <Text style={styles.calloutSubtitle}>{item.subtitle}</Text>
          </View>
        </Callout>
      ) : null}
    </Marker>
  );
}

function PermissionIntro({ visible, onCancel, onContinue }) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.permissionCard}>
          <View style={styles.permissionIcon}>
            <Ionicons color={colors.primary} name="navigate" size={28} />
          </View>
          <Text style={styles.permissionTitle}>Explore what is nearby</Text>
          <Text style={styles.permissionText}>
            AroundU uses your location only while you explore the map. Your
            position is not published, and background tracking stays off.
          </Text>
          <View style={styles.permissionFacts}>
            <Text style={styles.permissionFact}>• Foreground access only</Text>
            <Text style={styles.permissionFact}>• No continuous tracking</Text>
            <Text style={styles.permissionFact}>• Disable anytime</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onContinue}
            style={styles.enableButton}
          >
            <Text style={styles.enableButtonText}>Continue</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onCancel}
            style={styles.notNowButton}
          >
            <Text style={styles.notNowText}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function MapScreen() {
  const mapRef = useRef(null);
  const viewport = useWindowDimensions();
  const [isEnabled, setIsEnabled] = useState(false);
  const [showPermissionIntro, setShowPermissionIntro] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [activeType, setActiveType] = useState('all');
  const [items, setItems] = useState([]);
  const [hasFoursquarePlaces, setHasFoursquarePlaces] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const loadCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError('');

    try {
      const position = await locationService.getCurrentPosition();
      const nextCenter = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const nextRegion = {
        ...nextCenter,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

      setCenter(nextCenter);
      setRegion(nextRegion);
      mapRef.current?.animateToRegion?.(nextRegion, 500);
    } catch {
      setLocationError('Unable to get your current location.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    Promise.all([
      locationService.isNearbyEnabled(),
      locationService.getPermissionStatus(),
    ]).then(([enabled, permission]) => {
      if (!isActive) {
        return;
      }

      const canRestore = enabled && permission.granted;
      setIsEnabled(canRestore);
      setIsLoadingLocation(false);

      if (canRestore) {
        loadCurrentLocation();
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      setItems([]);
      setHasFoursquarePlaces(false);
      return;
    }

    let isActive = true;
    setIsLoadingData(true);

    Promise.allSettled([
      firestoreService.getNearbyPosts(center, radiusMeters),
      foursquareService.getNearbyPlaces(center, radiusMeters),
      firestoreService.getNearbyEvents(center, radiusMeters),
    ])
      .then(([postsResult, placesResult, eventsResult]) => {
        if (!isActive) {
          return;
        }

        const posts =
          postsResult.status === 'fulfilled' ? postsResult.value : [];
        const places =
          placesResult.status === 'fulfilled' ? placesResult.value : [];
        const events =
          eventsResult.status === 'fulfilled' ? eventsResult.value : [];
        const documents = [
          ...posts.map((item) => normalizeDocument(item, 'post')),
          ...places.map((item) => normalizeDocument(item, 'place')),
          ...events.map((item) => normalizeDocument(item, 'event')),
        ];
        setHasFoursquarePlaces(places.length > 0);
        setItems(
          documents.length ? documents : getDemoItems(center, radiusMeters),
        );
      })
      .catch(() => {
        if (isActive) {
          setHasFoursquarePlaces(false);
          setItems(getDemoItems(center, radiusMeters));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingData(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [center, isEnabled, radiusMeters]);

  const visibleItems = useMemo(
    () =>
      activeType === 'all'
        ? items
        : items.filter((item) => item.type === activeType),
    [activeType, items],
  );

  const clusters = useMemo(
    () => clusterMapItems(visibleItems, region, viewport),
    [region, viewport, visibleItems],
  );

  const enableNearby = async () => {
    setShowPermissionIntro(false);
    setIsLoadingLocation(true);

    try {
      const permission = await locationService.requestForegroundPermission();

      if (!permission.granted) {
        setLocationError(
          'Location permission is off. You can enable it from system settings.',
        );
        return;
      }

      await locationService.setNearbyEnabled(true);
      setIsEnabled(true);
      await loadCurrentLocation();
    } catch {
      setLocationError('Location access could not be enabled.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const disableNearby = async () => {
    await locationService.setNearbyEnabled(false);
    setIsEnabled(false);
    setSelectedCluster(null);
  };

  const handleClusterPress = (cluster) => {
    setSelectedCluster(cluster);

    if (cluster.items.length > 1) {
      const nextRegion = {
        ...cluster.coordinate,
        latitudeDelta: Math.max(region.latitudeDelta / 2.4, 0.008),
        longitudeDelta: Math.max(region.longitudeDelta / 2.4, 0.008),
      };
      mapRef.current?.animateToRegion?.(nextRegion, 350);
    }
  };

  const recenter = () => {
    loadCurrentLocation();
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Explore Map" />

      <View style={styles.mapContainer}>
        <MapView
          initialRegion={INITIAL_REGION}
          onPress={() => setSelectedCluster(null)}
          onRegionChangeComplete={setRegion}
          ref={mapRef}
          showsCompass={false}
          showsMyLocationButton={false}
          showsUserLocation={isEnabled}
          style={StyleSheet.absoluteFill}
        >
          {clusters.map((cluster) => (
            <DiscoveryMarker
              cluster={cluster}
              key={cluster.id}
              onPress={handleClusterPress}
            />
          ))}
        </MapView>

        {!isEnabled ? (
          <View style={styles.locationGate}>
            <View style={styles.gateIcon}>
              <Ionicons color={colors.primary} name="location" size={25} />
            </View>
            <Text style={styles.gateTitle}>Nearby discovery is off</Text>
            <Text style={styles.gateText}>
              Enable location when you want to discover public posts, places,
              and events around you.
            </Text>
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              disabled={isLoadingLocation}
              onPress={() => setShowPermissionIntro(true)}
              style={styles.enableButton}
            >
              {isLoadingLocation ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.enableButtonText}>Enable nearby map</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.controls}>
              <ScrollView
                contentContainerStyle={styles.controlRow}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {RADIUS_OPTIONS.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => {
                      setRadiusMeters(option.value);
                      setSelectedCluster(null);
                    }}
                    style={[
                      styles.filterChip,
                      radiusMeters === option.value && styles.filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        radiusMeters === option.value &&
                          styles.filterTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <ScrollView
                contentContainerStyle={styles.controlRow}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {TYPE_OPTIONS.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    onPress={() => {
                      setActiveType(option.value);
                      setSelectedCluster(null);
                    }}
                    style={[
                      styles.typeChip,
                      activeType === option.value && styles.typeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeText,
                        activeType === option.value && styles.typeTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.mapActions}>
              <Pressable
                accessibilityLabel="Center on my location"
                accessibilityRole="button"
                onPress={recenter}
                style={styles.mapActionButton}
              >
                <Ionicons color={colors.primary} name="locate" size={22} />
              </Pressable>
              <Pressable
                accessibilityLabel="Disable nearby map"
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert(
                    'Turn off nearby discovery?',
                    'AroundU will stop using your location for this map.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Turn Off',
                        onPress: disableNearby,
                        style: 'destructive',
                      },
                    ],
                  )
                }
                style={styles.mapActionButton}
              >
                <Ionicons color={colors.danger} name="location-outline" size={22} />
              </Pressable>
            </View>

            {isLoadingData ? (
              <View style={styles.loadingBadge}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.loadingText}>Finding nearby activity</Text>
              </View>
            ) : null}

            {!isLoadingData && hasFoursquarePlaces ? (
              <View style={styles.foursquareCredit}>
                <Text style={styles.foursquareCreditText}>
                  Places by Foursquare
                </Text>
              </View>
            ) : null}

            {selectedCluster ? (
              <View style={styles.clusterSheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>
                  {selectedCluster.items.length > 1
                    ? `${selectedCluster.items.length} results in this area`
                    : selectedCluster.items[0].title}
                </Text>
                {selectedCluster.items.map((item) => {
                  const meta = TYPE_META[item.type];

                  return (
                    <View key={item.id} style={styles.clusterItem}>
                      <View
                        style={[
                          styles.clusterItemIcon,
                          { backgroundColor: `${meta.color}18` },
                        ]}
                      >
                        <Ionicons color={meta.color} name={meta.icon} size={17} />
                      </View>
                      <View style={styles.clusterItemCopy}>
                        <Text numberOfLines={1} style={styles.clusterItemTitle}>
                          {item.title}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={styles.clusterItemSubtitle}
                        >
                          {item.subtitle}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </>
        )}
      </View>

      <PermissionIntro
        onCancel={() => setShowPermissionIntro(false)}
        onContinue={enableNearby}
        visible={showPermissionIntro}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  controls: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: spacing.md,
  },
  controlRow: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: '#D8E0EB',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: '#536174',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  typeChip: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.full,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  typeChipActive: {
    backgroundColor: '#172033',
  },
  typeText: {
    color: '#64748B',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  marker: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: radius.full,
    borderWidth: 3,
    elevation: 5,
    height: 40,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    width: 40,
  },
  clusterMarker: {
    height: 46,
    width: 46,
  },
  clusterCount: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },
  callout: {
    minWidth: 170,
    padding: spacing.sm,
  },
  calloutTitle: {
    color: colors.text,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  calloutSubtitle: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  mapActions: {
    gap: spacing.sm,
    position: 'absolute',
    right: spacing.md,
    top: 112,
  },
  mapActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.full,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    width: 44,
  },
  locationGate: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderColor: '#E0E6EF',
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: 90,
    padding: spacing.lg,
    position: 'absolute',
    shadowColor: '#64748B',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  gateIcon: {
    alignItems: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  gateTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginTop: spacing.md,
  },
  gateText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  enableButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    marginTop: spacing.lg,
    width: '100%',
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  loadingBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.full,
    bottom: 24,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
  },
  loadingText: {
    color: '#526173',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
  },
  foursquareCredit: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: radius.sm,
    bottom: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'absolute',
  },
  foursquareCreditText: {
    color: '#526173',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
  },
  clusterSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    bottom: 0,
    left: 0,
    maxHeight: '45%',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: 0,
    shadowColor: '#0F172A',
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#CBD5E1',
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    width: 42,
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginBottom: spacing.sm,
  },
  clusterItem: {
    alignItems: 'center',
    borderTopColor: '#EDF1F6',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: 10,
  },
  clusterItemIcon: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  clusterItemCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  clusterItemTitle: {
    color: '#344054',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  clusterItemSubtitle: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    marginTop: 2,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.52)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  permissionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
  },
  permissionIcon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#EAF1FF',
    borderRadius: radius.full,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  permissionTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  permissionFacts: {
    backgroundColor: '#F4F7FB',
    borderRadius: radius.md,
    gap: 6,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  permissionFact: {
    color: '#526173',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  notNowButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  notNowText: {
    color: colors.neutral,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
