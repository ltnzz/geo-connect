import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, spacing } from '../../utils/theme';

export default function EmptyNearbyEvent({ radius: filterRadius }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const radiusText = filterRadius === 'all' 
    ? 'anywhere near you' 
    : `within ${filterRadius} km of your location`;

  return (
    <View style={styles.emptyState}>
      <Ionicons color={colors.neutral} name="location-outline" size={34} />
      <Text style={styles.emptyTitle}>No nearby events</Text>
      <Text style={styles.emptyText}>
        There are no events {radiusText}.
      </Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    minHeight: 260,
  },
  emptyTitle: {
    color: colors.text,
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

