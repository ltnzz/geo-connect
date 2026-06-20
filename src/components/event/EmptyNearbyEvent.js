import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../utils/theme';

export default function EmptyNearbyEvent() {
  return (
    <View style={styles.emptyState}>
      <Ionicons color="#A5AFBD" name="location-outline" size={34} />
      <Text style={styles.emptyTitle}>No nearby events</Text>
      <Text style={styles.emptyText}>
        There are no events within a 1 km radius of your location.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    minHeight: 260,
  },
  emptyTitle: {
    color: '#465268',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.neutral,
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    marginTop: spacing.xs,
  },
});
