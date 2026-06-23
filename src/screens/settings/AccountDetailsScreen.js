import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import ProfileLocationPicker from '../../components/profile/ProfileLocationPicker';
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useColors, radius, spacing } from '../../utils/theme';

export default function AccountDetailsScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    city: user?.city || '',
    profileLocation: user?.profileLocation || null,
  });

  const updateEditField = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user?.uid || isSavingProfile) {
      return;
    }

    const updates = {
      username: editForm.username.trim().toLowerCase(),
      bio: editForm.bio.trim(),
      city: editForm.city.trim(),
      profileLocation: editForm.profileLocation,
    };

    if (!updates.username) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await firestoreService.updateUser(user.uid, updates);
      updateCurrentUser(updates);
      navigation.goBack();
    } catch {
      Alert.alert('Unable to save profile', 'Please check your connection and try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Account Details" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={(value) => updateEditField('username', value)}
            placeholder="username"
            placeholderTextColor={colors.neutral}
            style={styles.input}
            value={editForm.username}
          />

          <Text style={styles.inputLabel}>Location</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsLocationPickerVisible(true)}
            style={styles.locationPickerButton}
          >
            <View style={styles.locationPickerIcon}>
              <Ionicons color={colors.primary} name="map-outline" size={18} />
            </View>
            <View style={styles.locationPickerCopy}>
              <Text style={styles.locationPickerText}>
                {editForm.city || editForm.profileLocation?.address || 'Pick from map'}
              </Text>
              <Text style={styles.locationPickerHint}>
                Tap to choose your profile location
              </Text>
            </View>
            <Ionicons color={colors.neutral} name="chevron-forward" size={18} />
          </Pressable>

          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            multiline
            onChangeText={(value) => updateEditField('bio', value)}
            placeholder="Tell people what you are into"
            placeholderTextColor={colors.neutral}
            style={[styles.input, styles.bioInput]}
            value={editForm.bio}
          />

          <Pressable
            accessibilityRole="button"
            disabled={isSavingProfile}
            onPress={saveProfile}
            style={[styles.saveButton, isSavingProfile && styles.saveButtonDisabled]}
          >
            {isSavingProfile ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <ProfileLocationPicker
        onClose={() => setIsLocationPickerVisible(false)}
        onSelect={(location) => {
          setEditForm((current) => ({
            ...current,
            city: location.city || location.address || current.city,
            profileLocation: location,
          }));
          setIsLocationPickerVisible(false);
        }}
        visible={isLocationPickerVisible}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  inputLabel: {
    color: colors.mutedText,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  bioInput: {
    minHeight: 86,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  locationPickerButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  locationPickerIcon: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}1A`,
    borderRadius: radius.full,
    height: 34,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 34,
  },
  locationPickerCopy: {
    flex: 1,
  },
  locationPickerText: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  locationPickerHint: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    marginTop: 1,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    height: 46,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.72,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
});
