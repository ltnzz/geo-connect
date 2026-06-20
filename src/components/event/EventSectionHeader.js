import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../../utils/theme';

export default function EventSectionHeader({ title, buttonText, onButtonPress, showButton = true }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showButton && buttonText && (
        <Pressable
          accessibilityRole="button"
          onPress={onButtonPress}
          style={styles.viewButton}
        >
          <Text style={styles.viewText}>{buttonText}</Text>
          <Ionicons color={colors.primary} name="arrow-forward" size={13} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  viewButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingVertical: spacing.xs,
  },
  viewText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
});
