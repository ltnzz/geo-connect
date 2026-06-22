import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useColors, radius, spacing } from '../../utils/theme';

export default function ProfileLocationPicker({ onClose, onSelect, visible }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const useCurrentLocation = async () => {
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
      const [place] = await Location.reverseGeocodeAsync(coordinate);

      onSelect({
        ...coordinate,
        address: place?.street || place?.name || 'Current location',
        city: place?.city || place?.subregion || place?.region || '',
      });
    } catch {
      setError('Unable to load your current location.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons color={colors.primary} name="map-outline" size={24} />
          </View>
          <Text style={styles.title}>Pick Location</Text>
          <Text style={styles.text}>
            Map picking is available on the native app. On web, use your current location.
          </Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={isLoading}
            onPress={useCurrentLocation}
            style={styles.primaryButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryText}>Use Current Location</Text>
            )}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.46)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  icon: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    borderRadius: radius.full,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  title: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginTop: spacing.md,
  },
  text: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 44,
    justifyContent: 'center',
    marginTop: spacing.lg,
    width: '100%',
  },
  primaryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    alignItems: 'center',
  },
  cancelButton: {
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  cancelText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
});
