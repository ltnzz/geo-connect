import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState, useMemo, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import { LOCATION_SHARING } from '../../constants/firestore';
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useColors, radius, spacing } from '../../utils/theme';

const LOCATION_OPTIONS = [
  {
    value: LOCATION_SHARING.exact,
    label: 'Exact Location',
    description: 'Share your precise location.',
  },
  {
    value: LOCATION_SHARING.neighborhood,
    label: 'Nearby Radius',
    description: 'Only show an approximate 500 m area.',
  },
  {
    value: LOCATION_SHARING.city,
    label: 'City Level Only',
    description: 'Only share your current city.',
  },
  {
    value: LOCATION_SHARING.hidden,
    label: 'Hidden Completely',
    description: 'Do not attach a visible location.',
  },
];

function SectionLabel({ children, styles }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function MenuRow({ label, description, onPress, last = false, styles, colors }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !last && styles.rowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.menuCopy}>
        <Text style={styles.menuLabel}>{label}</Text>
        {description ? (
          <Text style={styles.menuDescription}>{description}</Text>
        ) : null}
      </View>
      <Ionicons color={colors.neutral} name="chevron-forward" size={18} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser);
  const logout = useAuthStore((state) => state.logout);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutConfirmVisible, setIsLogoutConfirmVisible] = useState(false);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const [invisibleMode, setInvisibleMode] = useState(
    user?.invisibleMode ?? false,
  );
  const [locationSharing, setLocationSharing] = useState(
    user?.locationSharing || LOCATION_SHARING.hidden,
  );

  const [localDarkMode, setLocalDarkMode] = useState(themeMode === 'dark');

  useEffect(() => {
    setLocalDarkMode(themeMode === 'dark');
  }, [themeMode]);

  const handleThemeToggle = (value) => {
    setLocalDarkMode(value);
    // Defer the heavy theme rendering recalculation by 150ms to allow switch slide animation to run smoothly on Native thread
    setTimeout(() => {
      setThemeMode(value ? 'dark' : 'light');
    }, 150);
  };

  const savePrivacySetting = async (updates) => {
    if (!user?.uid || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await firestoreService.updateUser(user.uid, updates);
      updateCurrentUser(updates);
    } catch {
      Alert.alert('Unable to save', 'Please check your connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const changeInvisibleMode = (value) => {
    setInvisibleMode(value);
    if (value && user?.uid) {
      firestoreService.clearSharedLocation(user.uid).catch(() => {});
    }
    savePrivacySetting({ invisibleMode: value }).catch(() => {});
  };

  const changeLocationSharing = (value) => {
    setLocationSharing(value);
    if (
      user?.uid &&
      [LOCATION_SHARING.city, LOCATION_SHARING.hidden].includes(value)
    ) {
      firestoreService.clearSharedLocation(user.uid).catch(() => {});
    }
    savePrivacySetting({ locationSharing: value }).catch(() => {});
  };

  const openLocationHistory = async () => {
    setIsHistoryVisible(true);

    if (!user?.uid) {
      setLocationHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    try {
      const history = await firestoreService.getLocationHistory(user.uid);
      setLocationHistory(history);
    } catch {
      setLocationHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const isDarkMode = themeMode === 'dark';

  const deleteLocationData = () => {
    Alert.alert(
      'Delete all location data?',
      'Your saved private location will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.uid) {
              return;
            }

            setIsSaving(true);
            try {
              await firestoreService.clearLocationHistory(user.uid);
              await firestoreService.updateUser(user.uid, {
                invisibleMode: true,
                locationSharing: LOCATION_SHARING.hidden,
              });
              setInvisibleMode(true);
              setLocationSharing(LOCATION_SHARING.hidden);
              updateCurrentUser({
                invisibleMode: true,
                locationSharing: LOCATION_SHARING.hidden,
              });
              Alert.alert('Location data deleted');
            } catch {
              Alert.alert(
                'Unable to delete',
                'Please check your connection and try again.',
              );
            } finally {
              setIsSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    setIsLogoutConfirmVisible(false);
    const didLogout = await logout();

    if (!didLogout) {
      Alert.alert('Unable to log out', 'Please try again.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader showBack title="Settings & Privacy" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionLabel styles={styles}>ACCOUNT</SectionLabel>
        <View style={styles.card}>
          <MenuRow
            label="Account Details"
            styles={styles}
            colors={colors}
            onPress={() =>
              Alert.alert('Account Details', 'Profile editing will be available soon.')
            }
          />
          <MenuRow
            label="Notifications"
            last
            styles={styles}
            colors={colors}
            onPress={() => navigation.navigate('Notification')}
          />
        </View>

        <SectionLabel styles={styles}>APPEARANCE</SectionLabel>
        <View style={styles.card}>
          <View style={styles.invisibleRow}>
            <View style={styles.lockIcon}>
              <Ionicons color={colors.primary} name="contrast" size={17} />
            </View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuLabel}>Dark Mode</Text>
              <Text style={styles.menuDescription}>
                Switch between light and dark app appearance.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Dark mode"
              onValueChange={handleThemeToggle}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D8DEE8', true: colors.primary }}
              value={localDarkMode}
            />
          </View>
        </View>

        <SectionLabel styles={styles}>LOCATION VISIBILITY</SectionLabel>
        <View style={styles.card}>
          <View style={[styles.invisibleRow, styles.rowBorder]}>
            <View style={styles.lockIcon}>
              <Ionicons color={colors.primary} name="lock-closed" size={17} />
            </View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuLabel}>Invisible Mode</Text>
              <Text style={styles.menuDescription}>
                Stay active without appearing in Nearby People.
              </Text>
            </View>
            <Switch
              accessibilityLabel="Invisible mode"
              disabled={isSaving}
              onValueChange={changeInvisibleMode}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#D8DEE8', true: colors.primary }}
              value={invisibleMode}
            />
          </View>

          <View style={styles.precisionContent}>
            <Text style={styles.precisionTitle}>Share Location Precision</Text>
            {LOCATION_OPTIONS.map((option) => {
              const isSelected = locationSharing === option.value;

              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  disabled={isSaving}
                  key={option.value}
                  onPress={() => changeLocationSharing(option.value)}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.menuCopy}>
                    <Text
                      style={[
                        styles.optionLabel,
                        isSelected && styles.optionLabelSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      isSelected && styles.radioSelected,
                    ]}
                  >
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <SectionLabel styles={styles}>DATA MANAGEMENT</SectionLabel>
        <View style={styles.card}>
          <MenuRow
            description="View and delete your past geodata."
            label="Location History"
            last
            styles={styles}
            colors={colors}
            onPress={openLocationHistory}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={deleteLocationData}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.danger} size="small" />
          ) : (
            <Text style={styles.deleteText}>Delete All Location Data</Text>
          )}
        </Pressable>
        <Text style={styles.deleteHint}>
          This action is permanent and cannot be undone.
        </Text>

        <Pressable
          accessibilityRole="button"
          disabled={isAuthLoading}
          onPress={() => setIsLogoutConfirmVisible(true)}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.pressed,
          ]}
        >
          {isAuthLoading ? (
            <ActivityIndicator color={colors.mutedText} size="small" />
          ) : (
            <>
              <Ionicons
                color={colors.mutedText}
                name="log-out-outline"
                size={18}
              />
              <Text style={styles.logoutText}>Log Out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsLogoutConfirmVisible(false)}
        transparent
        visible={isLogoutConfirmVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.logoutModal}>
            <View style={styles.logoutModalIcon}>
              <Ionicons
                color={colors.danger}
                name="log-out-outline"
                size={24}
              />
            </View>
            <Text style={styles.logoutModalTitle}>Log out of AroundU?</Text>
            <Text style={styles.logoutModalText}>
              You will need to sign in again to access your account.
            </Text>
            <View style={styles.logoutModalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsLogoutConfirmVisible(false)}
                style={styles.cancelLogoutButton}
              >
                <Text style={styles.cancelLogoutText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={handleLogout}
                style={styles.confirmLogoutButton}
              >
                <Text style={styles.confirmLogoutText}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsHistoryVisible(false)}
        transparent
        visible={isHistoryVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.historyModal}>
            <View style={styles.historyHeader}>
              <Text style={styles.logoutModalTitle}>Location History</Text>
              <Pressable
                accessibilityLabel="Close location history"
                accessibilityRole="button"
                onPress={() => setIsHistoryVisible(false)}
                style={styles.historyClose}
              >
                <Ionicons color={colors.neutral} name="close" size={21} />
              </Pressable>
            </View>

            {isHistoryLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.historyLoader} />
            ) : locationHistory.length ? (
              <ScrollView style={styles.historyList}>
                {locationHistory.map((entry) => (
                  <View key={entry.id} style={styles.historyRow}>
                    <View style={styles.historyIcon}>
                      <Ionicons
                        color={colors.primary}
                        name={entry.type === 'checkin' ? 'business' : 'location'}
                        size={16}
                      />
                    </View>
                    <View style={styles.menuCopy}>
                      <Text style={styles.menuLabel}>{entry.title}</Text>
                      <Text style={styles.menuDescription}>
                        {entry.subtitle}
                      </Text>
                      {Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude) ? (
                        <Text style={styles.historyCoordinate}>
                          {entry.latitude.toFixed(5)}, {entry.longitude.toFixed(5)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.logoutModalText}>
                No location history is stored for this account.
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={deleteLocationData}
              style={styles.historyDeleteButton}
            >
              <Text style={styles.deleteText}>Delete Location History</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 48,
    paddingHorizontal: spacing.lg,
  },
  sectionLabel: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: colors.neutral,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuCopy: {
    flex: 1,
  },
  menuLabel: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  menuDescription: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  invisibleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 76,
    padding: spacing.md,
  },
  lockIcon: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 34,
  },
  precisionContent: {
    padding: spacing.md,
  },
  precisionTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  optionLabel: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  optionLabelSelected: {
    color: colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionDescription: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    marginTop: 1,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 18,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    height: 10,
    width: 10,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 62,
    minHeight: 42,
  },
  deleteText: {
    color: colors.danger,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  deleteHint: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 44,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  logoutText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logoutModal: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
  },
  logoutModalIcon: {
    alignItems: 'center',
    backgroundColor: `${colors.danger}15`,
    borderRadius: radius.full,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  logoutModalTitle: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    marginTop: spacing.md,
  },
  logoutModalText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  logoutModalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  cancelLogoutButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  cancelLogoutText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  confirmLogoutButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  confirmLogoutText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  historyModal: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '78%',
    padding: spacing.lg,
    width: '100%',
  },
  historyHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  historyClose: {
    padding: spacing.xs,
  },
  historyLoader: {
    marginVertical: spacing.xl,
  },
  historyList: {
    maxHeight: 340,
  },
  historyRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  historyIcon: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 34,
  },
  historyCoordinate: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    marginTop: 2,
  },
  historyDeleteButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  pressed: {
    opacity: 0.65,
  },
});
