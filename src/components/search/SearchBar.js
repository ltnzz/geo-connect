import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, radius, spacing } from '../../utils/theme';

export default function SearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search around you',
  autoFocus = true,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons color={colors.neutral} name="search-outline" size={20} />
        <TextInput
          autoFocus={autoFocus}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.neutral}
          returnKeyType="search"
          style={styles.searchInput}
          value={value}
        />
        {value ? (
          <Pressable
            accessibilityLabel="Clear search"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClear}
          >
            <Ionicons color={colors.neutral} name="close-circle" size={20} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    height: 42,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
});
