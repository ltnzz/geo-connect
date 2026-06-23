import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, radius, spacing } from '../../utils/theme';
import { useNotificationStore } from '../../stores/notificationStore';

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
  leftIcon,
  onLeftPress,
  rightComponent,
  onSearchIconPress,
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
        ) : showBack || leftIcon ? (
          <Pressable
            accessibilityRole="button"
            onPress={onLeftPress || (() => navigation.goBack())}
            style={styles.iconButton}
          >
            <Ionicons
              color={colors.text}
              name={leftIcon || 'arrow-back-outline'}
              size={24}
            />
          </Pressable>
        ) : (
          <Pressable
            accessibilityLabel="Open search"
            accessibilityRole="button"
            onPress={onSearchIconPress || (() => showSearch && setIsSearchOpen(true))}
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

        {rightComponent ? (
          rightComponent
        ) : (
          <Pressable
            accessibilityLabel={rightLabel}
            accessibilityRole="button"
            disabled={(showBack || leftIcon) && !showRightOnBack}
            onPress={
              onRightPress || (() => navigation.navigate('Notification'))
            }
            style={[
              styles.iconButton,
              (showBack || leftIcon) && !showRightOnBack && { opacity: 0 },
            ]}
          >
            <View>
              <Ionicons color={colors.text} name={rightIcon} size={24} />
              {rightIcon.includes('notification') && unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
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
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
  },
});
