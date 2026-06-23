import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, spacing } from '../../utils/theme';

export default function EmptyNewEvent() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.emptyState}>
      <Ionicons color={colors.neutral} name="calendar-outline" size={34} />
      <Text style={styles.emptyTitle}>No new events</Text>
      <Text style={styles.emptyText}>
        There are no new events added recently.
      </Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    minHeight: 180,
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
