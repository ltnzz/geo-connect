import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../../utils/theme';

export default function ScreenHeader({ title, showBack = false }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {showBack ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="arrow-back-outline" size={24} />
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" style={styles.iconButton}>
            <Ionicons color={colors.text} name="search-outline" size={24} />
          </Pressable>
        )}

        <Text numberOfLines={1} style={styles.title}>
          {showBack ? title : 'AroundU'}
        </Text>

        <Pressable 
          accessibilityRole="button" 
          disabled={showBack}
          onPress={() => navigation.navigate('Notification')}
          style={[styles.iconButton, showBack && { opacity: 0 }]}
        >
          <Ionicons color={colors.text} name="notifications-outline" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  title: {
    color: colors.primary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
  },
  iconButton: {
    padding: spacing.xs,
  },
});
