import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { firestoreService } from '../../services/firestoreService';
import { useColors, radius, spacing } from '../../utils/theme';
import { calculateDistance } from '../../utils/locationUtils';

const DEFAULT_REGION = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function LocationSelectModal({ visible, onClose, onSelect, currentUserLocation }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [currentView, setCurrentView] = useState('menu'); // 'menu' | 'map' | 'venue'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Map state
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [selectedCoord, setSelectedCoord] = useState(null);
  const [mapAddressLabel, setMapAddressLabel] = useState('');
  const [mapCityLabel, setMapCityLabel] = useState('');
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isMapGeocoding, setIsMapGeocoding] = useState(false);

  // Venue state
  const [venueSearchQuery, setVenueSearchQuery] = useState('');
  const [venues, setVenues] = useState([]);
  const [isFetchingVenues, setIsFetchingVenues] = useState(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (visible) {
      setCurrentView('menu');
      setError('');
      setIsLoading(false);
      
      // Initialize map state
      if (currentUserLocation) {
        setMapRegion({
          latitude: currentUserLocation.latitude,
          longitude: currentUserLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        setSelectedCoord({
          latitude: currentUserLocation.latitude,
          longitude: currentUserLocation.longitude,
        });
        setMapAddressLabel(currentUserLocation.address || 'Selected Location');
        setMapCityLabel(currentUserLocation.city || '');
      } else {
        setMapRegion(DEFAULT_REGION);
        setSelectedCoord(null);
        setMapAddressLabel('');
        setMapCityLabel('');
      }
      
      setMapSearchQuery('');
      setVenueSearchQuery('');
      setVenues([]);
    }
  }, [visible, currentUserLocation]);

  // Handle Option 1: Lokasi Anda
  const handleSelectCurrentLocation = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        setIsLoading(false);
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      const geocode = await Location.reverseGeocodeAsync(coords);
      let address = 'Current Location';
      let city = 'Nearby';
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        city = place.city || place.subregion || place.region || 'Nearby';
        address = place.street || place.name || 'Current Location';
      }

      onSelect({
        ...coords,
        address,
        city,
        placeId: null,
      });
      onClose();
    } catch (err) {
      setError('Failed to get current location. Ensure GPS is enabled.');
    } finally {
      setIsLoading(false);
    }
  };

  // Map view geocoding & reverse geocoding helper
  const updateAddressLabel = async (coord) => {
    try {
      const geocode = await Location.reverseGeocodeAsync(coord);
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        setMapAddressLabel(place.street || place.name || 'Selected Location');
        setMapCityLabel(place.city || place.subregion || place.region || '');
      } else {
        setMapAddressLabel('Selected Location');
        setMapCityLabel('');
      }
    } catch {
      setMapAddressLabel('Selected Location');
      setMapCityLabel('');
    }
  };

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    setSelectedCoord(coord);
    updateAddressLabel(coord);
  };

  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim()) return;
    setIsMapGeocoding(true);
    setError('');
    try {
      const results = await Location.geocodeAsync(mapSearchQuery);
      if (results && results.length > 0) {
        const coord = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
        setSelectedCoord(coord);
        setMapRegion({
          ...coord,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
        await updateAddressLabel(coord);
      } else {
        setError('Location not found. Try another search.');
      }
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsMapGeocoding(false);
    }
  };

  const confirmMapSelection = () => {
    if (!selectedCoord) {
      setError('Please tap on the map to pick a location.');
      return;
    }
    onSelect({
      latitude: selectedCoord.latitude,
      longitude: selectedCoord.longitude,
      address: mapAddressLabel,
      city: mapCityLabel,
      placeId: null,
    });
    onClose();
  };

  // Venue selection: Fetch venues from Firestore
  const loadVenues = useCallback(async (searchQuery = '') => {
    setIsFetchingVenues(true);
    setError('');
    try {
      let data = [];
      if (searchQuery.trim()) {
        data = await firestoreService.searchPlaces(searchQuery);
      } else if (currentUserLocation) {
        // Fetch nearby places if user location is available
        const nearby = await firestoreService.getNearbyPlaces(
          {
            latitude: currentUserLocation.latitude,
            longitude: currentUserLocation.longitude,
          },
          10000, // 10 km
          30
        );
        data = nearby || [];
      } else {
        // Fetch all places as a fallback
        data = await firestoreService.getAllPlaces(30);
      }
      setVenues(data);
    } catch (err) {
      setError('Failed to load venues.');
    } finally {
      setIsFetchingVenues(false);
    }
  }, [currentUserLocation]);

  // Load venues on mount / view switch
  useEffect(() => {
    if (currentView === 'venue') {
      loadVenues(venueSearchQuery);
    }
  }, [currentView, venueSearchQuery, loadVenues]);

  // Handle debounce search for venue
  useEffect(() => {
    if (currentView !== 'venue') return;
    const timer = setTimeout(() => {
      loadVenues(venueSearchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [venueSearchQuery]);

  const handleSelectVenue = (venue) => {
    onSelect({
      latitude: venue.location.latitude,
      longitude: venue.location.longitude,
      address: venue.name, // Use venue name as address to tag it clearly
      city: venue.city || venue.address || '',
      placeId: venue.id,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        {/* Render View: Option Menu */}
        {currentView === 'menu' && (
          <View style={styles.viewContainer}>
            <View style={styles.header}>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.headerTitle}>Pilih Lokasi</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.menuContent}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Mendapatkan lokasi...</Text>
                </View>
              ) : (
                <>
                  <Pressable onPress={handleSelectCurrentLocation} style={styles.menuOption}>
                    <View style={styles.optionIconContainer}>
                      <Ionicons name="navigate" size={22} color={colors.primary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Lokasi Anda</Text>
                      <Text style={styles.optionDescription}>Gunakan posisi GPS saat ini</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.neutral} />
                  </Pressable>

                  <Pressable onPress={() => setCurrentView('map')} style={styles.menuOption}>
                    <View style={[styles.optionIconContainer, { backgroundColor: '#7C3AED1A' }]}>
                      <Ionicons name="map" size={22} color="#7C3AED" />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Pilih Lokasi dari Map</Text>
                      <Text style={styles.optionDescription}>Cari alamat atau tentukan pin di map</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.neutral} />
                  </Pressable>

                  <Pressable onPress={() => setCurrentView('venue')} style={styles.menuOption}>
                    <View style={[styles.optionIconContainer, { backgroundColor: '#DB27771A' }]}>
                      <Ionicons name="business" size={22} color="#DB2777" />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionTitle}>Pilih Venue</Text>
                      <Text style={styles.optionDescription}>Kaitkan postingan dengan tempat / venue</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.neutral} />
                  </Pressable>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </>
              )}
            </View>
          </View>
        )}

        {/* Render View: Choose Location from Map */}
        {currentView === 'map' && (
          <View style={styles.viewContainer}>
            <View style={styles.header}>
              <Pressable onPress={() => setCurrentView('menu')} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.headerTitle}>Pilih dari Map</Text>
              <Pressable onPress={confirmMapSelection} style={styles.useButton}>
                <Text style={styles.useButtonText}>Gunakan</Text>
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.neutral} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Cari lokasi atau alamat..."
                  placeholderTextColor={colors.neutral}
                  style={styles.searchInput}
                  value={mapSearchQuery}
                  onChangeText={setMapSearchQuery}
                  onSubmitEditing={handleMapSearch}
                  returnKeyType="search"
                />
                {mapSearchQuery.length > 0 && (
                  <Pressable onPress={() => setMapSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={colors.neutral} />
                  </Pressable>
                )}
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <MapView
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
                onPress={handleMapPress}
                style={StyleSheet.absoluteFillObject}
              >
                {selectedCoord && <Marker coordinate={selectedCoord} />}
              </MapView>

              {isMapGeocoding && (
                <View style={styles.mapLoadingOverlay}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.bottomCard}>
              <View style={styles.bottomCardHeader}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.bottomCardTitle} numberOfLines={1}>
                  {mapAddressLabel || 'Ketuk peta untuk memilih lokasi'}
                </Text>
              </View>
              {mapCityLabel ? (
                <Text style={styles.bottomCardSub}>{mapCityLabel}</Text>
              ) : null}
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={confirmMapSelection}
                disabled={!selectedCoord}
                style={[styles.confirmButton, !selectedCoord && styles.confirmButtonDisabled]}
              >
                <Text style={styles.confirmButtonText}>Gunakan Lokasi Ini</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Render View: Select Venue */}
        {currentView === 'venue' && (
          <View style={styles.viewContainer}>
            <View style={styles.header}>
              <Pressable onPress={() => setCurrentView('menu')} style={styles.closeButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.headerTitle}>Pilih Venue</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={colors.neutral} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Cari nama venue atau tempat..."
                  placeholderTextColor={colors.neutral}
                  style={styles.searchInput}
                  value={venueSearchQuery}
                  onChangeText={setVenueSearchQuery}
                />
                {venueSearchQuery.length > 0 && (
                  <Pressable onPress={() => setVenueSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={colors.neutral} />
                  </Pressable>
                )}
              </View>
            </View>

            {isFetchingVenues ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Mencari venue...</Text>
              </View>
            ) : (
              <FlatList
                data={venues}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="business" size={48} color={colors.neutral} />
                    <Text style={styles.emptyText}>Venue tidak ditemukan</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  let distanceText = '';
                  if (currentUserLocation && item.location?.latitude && item.location?.longitude) {
                    const d = calculateDistance(
                      currentUserLocation.latitude,
                      currentUserLocation.longitude,
                      item.location.latitude,
                      item.location.longitude
                    );
                    if (d !== null) {
                      distanceText = d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
                    }
                  }

                  return (
                    <Pressable onPress={() => handleSelectVenue(item)} style={styles.venueItem}>
                      <View style={styles.venueIconContainer}>
                        <Ionicons name="business" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.venueInfo}>
                        <Text style={styles.venueName}>{item.name}</Text>
                        <Text style={styles.venueAddress} numberOfLines={1}>
                          {[item.category, item.city || item.address].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      {distanceText ? (
                        <Text style={styles.venueDistance}>{distanceText}</Text>
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        )}
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  viewContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    height: 56,
    paddingHorizontal: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  useButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  useButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  menuContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  optionIconContainer: {
    backgroundColor: `${colors.primary}1A`,
    padding: 10,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  optionDescription: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    paddingVertical: 0,
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCard: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  bottomCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bottomCardTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  bottomCardSub: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 24,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  listContent: {
    padding: spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  venueIconContainer: {
    backgroundColor: `${colors.primary}1A`,
    padding: 8,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  venueAddress: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  venueDistance: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginLeft: spacing.xs,
  },
});
