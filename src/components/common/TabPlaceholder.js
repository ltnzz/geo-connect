import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import ScreenHeader from './ScreenHeader';
import { colors, spacing } from '../../utils/theme';

export default function TabPlaceholder({ icon, title, subtitle, showBack = false }) {
  return (
    <View style={styles.screen}>
      <ScreenHeader title={title} showBack={showBack} />

      <View style={styles.content}>
        <Ionicons color={colors.neutral} name={icon} size={40} />
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
