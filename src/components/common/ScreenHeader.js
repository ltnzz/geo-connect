import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../utils/theme';

export default function ScreenHeader({
  title,
  showBack = false,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  rightIcon = 'notifications-outline',
  rightLabel = 'Notifications',
  onRightPress,
  showRightOnBack = false,
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const closeSearch = () => {
    setIsSearchOpen(false);
    onSearchChange?.('');
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {showSearch && isSearchOpen ? (
          <View style={styles.searchContainer}>
            <Ionicons
              color={colors.neutral}
              name="search-outline"
              size={20}
            />
            <TextInput
              accessibilityLabel="Search posts"
              autoFocus
              onChangeText={onSearchChange}
              placeholder="Search around you"
              placeholderTextColor={colors.neutral}
              returnKeyType="search"
              style={styles.searchInput}
              value={searchValue}
            />
            <Pressable
              accessibilityLabel="Close search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={closeSearch}
            >
              <Ionicons
                color={colors.neutral}
                name="close"
                size={20}
              />
            </Pressable>
          </View>
        ) : showBack ? (
          <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons color={colors.text} name="arrow-back-outline" size={24} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Open search"
            accessibilityRole="button"
            onPress={() => showSearch && setIsSearchOpen(true)}
            style={styles.iconButton}
          >
            <Ionicons color={colors.text} name="search-outline" size={24} />
          </Pressable>
        )}

        {!(showSearch && isSearchOpen) ? (
          <Text numberOfLines={1} style={styles.title}>
            {title || 'AroundU'}
          </Text>
        ) : null}

        <Pressable
          accessibilityLabel={rightLabel}
          accessibilityRole="button"
          disabled={showBack && !showRightOnBack}
          onPress={
            onRightPress || (() => navigation.navigate('Notification'))
          }
          style={[
            styles.iconButton,
            showBack && !showRightOnBack && { opacity: 0 },
          ]}
        >
          <Ionicons color={colors.text} name={rightIcon} size={24} />
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
  searchContainer: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginRight: spacing.sm,
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
