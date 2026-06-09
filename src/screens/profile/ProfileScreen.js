import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { useAuthStore } from '../../stores/authStore';
import { colors, radius, spacing } from '../../utils/theme';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Profile" />

      <View style={styles.content}>
        <View style={styles.avatar}>
          <Ionicons color={colors.surface} name="person" size={36} />
        </View>

        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.username}>@{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <Pressable
          accessibilityRole="button"
          disabled={isLoading}
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <>
              <Ionicons color={colors.danger} name="log-out-outline" size={20} />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </Pressable>
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
    padding: spacing.xl,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginTop: spacing.xl,
    width: 80,
  },
  name: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    marginTop: spacing.md,
  },
  username: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  email: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginTop: spacing.sm,
  },
  logoutButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 48,
    paddingHorizontal: spacing.xl,
  },
  logoutText: {
    color: colors.danger,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
