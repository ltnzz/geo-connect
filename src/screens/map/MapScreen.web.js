import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { colors, spacing } from '../../utils/theme';

export default function MapScreen() {
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Explore Map" />
      <View style={styles.content}>
        <Ionicons color={colors.primary} name="map-outline" size={46} />
        <Text style={styles.title}>Map preview is mobile-only</Text>
        <Text style={styles.description}>
          Open the Android or iOS build to explore nearby posts, Foursquare
          places, and events on the interactive map.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#EAF0F8',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginTop: spacing.md,
  },
  description: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.sm,
    maxWidth: 360,
    textAlign: 'center',
  },
});
