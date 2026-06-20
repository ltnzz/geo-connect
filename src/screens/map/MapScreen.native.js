import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { DUMMY_EVENTS } from '../../data/dummyEvents';
import { DEFAULT_MAP_CENTER } from '../../data/mapDiscoveryData';
import { firestoreService } from '../../services/firestoreService';
import { locationService } from '../../services/locationService';
import { useAuthStore } from '../../stores/authStore';
import { getDistanceMeters } from '../../utils/geo';
import { clusterMapItems } from '../../utils/mapCluster';
import { colors, radius, spacing } from '../../utils/theme';

import MapView, { Callout, Marker } from 'react-native-maps';

const LOCATION_REFRESH_INTERVAL = 2 * 60 * 1000;

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
  { label: 'People', value: 'user' },
  { label: 'Events', value: 'event' },
];

const TYPE_META = {
  user: { color: colors.tertiary, icon: 'person' },
  event: { color: '#7C3AED', icon: 'calendar' },
};

const normalizeConnection = (connection) => ({
  id: `user-${connection.id}`,
  type: 'user',
  title: `@${connection.username}`,
  subtitle: connection.city || 'Nearby',
  coordinate: {
    latitude: connection.location.latitude,
    longitude: connection.location.longitude,
  },
});

const getEventItems = (center, radiusMeters) =>
  DUMMY_EVENTS.filter(
    (event) =>
      event.coordinate &&
      getDistanceMeters(center, event.coordinate) <= radiusMeters,
  ).map((event) => ({
    id: `event-${event.id}`,
    type: 'event',
    sourceId: event.id,
    title: event.title,
    subtitle: `${event.schedule} - ${event.venue}`,
    coordinate: event.coordinate,
  }));

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
            sharing preference controls whether mutual connections can see you.
            Background tracking stays off.
          </Text>
          <View style={styles.permissionFacts}>
            <Text style={styles.permissionFact}>- Foreground access only</Text>
            <Text style={styles.permissionFact}>- No continuous tracking</Text>
            <Text style={styles.permissionFact}>- Disable anytime</Text>
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
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const isLocationRefreshInFlight = useRef(false);
  const viewport = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const [isEnabled, setIsEnabled] = useState(false);
  const [showPermissionIntro, setShowPermissionIntro] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [hasResolvedLocation, setHasResolvedLocation] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [center, setCenter] = useState(DEFAULT_MAP_CENTER);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [activeType, setActiveType] = useState('all');
  const [items, setItems] = useState([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const loadCurrentLocation = useCallback(
    async ({ animate = true, showLoading = true } = {}) => {
      if (isLocationRefreshInFlight.current) {
        return;
      }

      isLocationRefreshInFlight.current = true;
      if (showLoading) {
        setIsLoadingLocation(true);
      }
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
        setHasResolvedLocation(true);
        setRefreshVersion((current) => current + 1);

        if (animate) {
          setRegion(nextRegion);
          mapRef.current?.animateToRegion?.(nextRegion, 500);
        }
      } catch {
        setLocationError('Unable to get your current location.');
      } finally {
        isLocationRefreshInFlight.current = false;
        if (showLoading) {
          setIsLoadingLocation(false);
        }
      }
    },
    [],
  );

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
  }, [loadCurrentLocation]);

  useFocusEffect(
    useCallback(() => {
      if (!isEnabled) {
        return undefined;
      }

      let refreshTimer = null;
      let appState = AppState.currentState;

      const stopRefreshTimer = () => {
        if (refreshTimer) {
          clearInterval(refreshTimer);
          refreshTimer = null;
        }
      };
      const refreshLocation = () =>
        loadCurrentLocation({ animate: false, showLoading: false });
      const startRefreshTimer = () => {
        stopRefreshTimer();
        refreshTimer = setInterval(
          refreshLocation,
          LOCATION_REFRESH_INTERVAL,
        );
      };

      if (appState === 'active') {
        startRefreshTimer();
      }

      const subscription = AppState.addEventListener(
        'change',
        (nextAppState) => {
          const returnedToForeground =
            appState !== 'active' && nextAppState === 'active';
          appState = nextAppState;

          if (nextAppState === 'active') {
            if (returnedToForeground) {
              refreshLocation();
            }
            startRefreshTimer();
          } else {
            stopRefreshTimer();
          }
        },
      );

      return () => {
        stopRefreshTimer();
        subscription.remove();
      };
    }, [isEnabled, loadCurrentLocation]),
  );

  useEffect(() => {
    if (!isEnabled || !hasResolvedLocation || !user?.uid) {
      return;
    }

    firestoreService.syncSharedLocation(user, center).catch(() => {});
  }, [
    center,
    hasResolvedLocation,
    isEnabled,
    refreshVersion,
    user?.invisibleMode,
    user?.locationSharing,
    user?.uid,
  ]);

  useEffect(() => {
    if (!isEnabled) {
      setItems([]);
      return;
    }

    let isActive = true;
    setIsLoadingData(true);

    firestoreService
      .getMutualConnectionLocations(user?.uid)
      .then((connections) => {
        if (!isActive) {
          return;
        }

        const nearbyConnections = connections
          .filter(
            (connection) =>
              getDistanceMeters(center, connection.location) <= radiusMeters,
          )
          .map(normalizeConnection);

        setItems([
          ...nearbyConnections,
          ...getEventItems(center, radiusMeters),
        ]);
      })
      .catch(() => {
        if (isActive) {
          setItems(getEventItems(center, radiusMeters));
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
  }, [center, isEnabled, radiusMeters, refreshVersion, user?.uid]);

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
    setHasResolvedLocation(false);

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
    if (user?.uid) {
      await firestoreService.clearSharedLocation(user.uid).catch(() => {});
    }
    setIsEnabled(false);
    setHasResolvedLocation(false);
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
              Enable location to find mutual connections who share their
              location and events from the Events page.
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
                <Text style={styles.loadingText}>
                  Finding connections and events
                </Text>
              </View>
            ) : null}

            {!isLoadingData && visibleItems.length === 0 ? (
              <View style={styles.emptyBadge}>
                <Ionicons
                  color={colors.neutral}
                  name="information-circle-outline"
                  size={17}
                />
                <Text style={styles.loadingText}>
                  No shared connections or events in this radius
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
                    <Pressable
                      accessibilityRole={item.type === 'event' ? 'button' : 'text'}
                      disabled={item.type !== 'event'}
                      key={item.id}
                      onPress={() =>
                        navigation.navigate('EventDetail', {
                          eventId: item.sourceId,
                        })
                      }
                      style={styles.clusterItem}
                    >
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
                    </Pressable>
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
  emptyBadge: {
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
