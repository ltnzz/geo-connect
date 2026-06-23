import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useColors, radius, spacing } from '../../utils/theme';

const DEFAULT_REGION = {
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const getLocationLabel = async (coordinate) => {
  const [place] = await Location.reverseGeocodeAsync(coordinate);

  return {
    address: place?.street || place?.name || place?.district || 'Selected location',
    city: place?.city || place?.subregion || place?.region || '',
  };
};

export default function ProfileLocationPicker({ onClose, onSelect, visible }) {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [selected, setSelected] = useState(null);
  const [label, setLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let isActive = true;

    const loadCurrentLocation = async () => {
      setIsLoading(true);
      setError('');

      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setError('Location permission denied.');
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        const place = await getLocationLabel(coordinate);

        if (isActive) {
          setSelected(coordinate);
          setLabel(place.city || place.address);
          setRegion({
            ...coordinate,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          });
        }
      } catch {
        if (isActive) {
          setError('Unable to load your current location.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadCurrentLocation();

    return () => {
      isActive = false;
    };
  }, [visible]);

  const chooseCoordinate = async (coordinate) => {
    setSelected(coordinate);
    setRegion((current) => ({ ...current, ...coordinate }));
    setError('');

    try {
      const place = await getLocationLabel(coordinate);
      setLabel(place.city || place.address);
    } catch {
      setLabel('Selected location');
    }
  };

  const confirmSelection = async () => {
    if (!selected) {
      setError('Pick a location on the map first.');
      return;
    }

    const place = await getLocationLabel(selected).catch(() => ({
      address: 'Selected location',
      city: label,
    }));

    onSelect({
      ...selected,
      address: place.address,
      city: place.city || label,
    });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.iconButton}>
            <Ionicons color={colors.text} name="close" size={22} />
          </Pressable>
          <Text style={styles.title}>Pick Location</Text>
          <Pressable
            accessibilityRole="button"
            onPress={confirmSelection}
            style={styles.confirmButton}
          >
            <Text style={styles.confirmText}>Use</Text>
          </Pressable>
        </View>

        <MapView
          onPress={(event) => chooseCoordinate(event.nativeEvent.coordinate)}
          onRegionChangeComplete={setRegion}
          region={region}
          style={styles.map}
        >
          {selected ? <Marker coordinate={selected} /> : null}
        </MapView>

        <View style={styles.sheet}>
          {isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          <Text style={styles.sheetTitle}>{label || 'Tap the map to choose'}</Text>
          <Text style={styles.sheetText}>
            This updates the city shown on your profile.
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  iconButton: {
    padding: spacing.xs,
  },
  title: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  confirmText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  map: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.md,
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  sheetText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: spacing.sm,
  },
});
