import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '../../utils/theme';
import { imagePickerService } from '../../services/imagePickerService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';

export default function CreateEventScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const prependEvent = useEventStore((s) => s.prependEvent);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [asset, setAsset] = useState(null);
  const [location, setLocation] = useState(null);
  
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);

  const handlePickImage = async () => {
    setError(null);
    try {
      const picked = await imagePickerService.fromLibrary();
      if (picked) setAsset(picked);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGetLocation = async () => {
    setIsFetchingLocation(true);
    setError(null);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        setIsFetchingLocation(false);
        return;
      }

      let currentPos = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: currentPos.coords.latitude,
        longitude: currentPos.coords.longitude,
      });

      if (geocode.length > 0) {
        const place = geocode[0];
        setLocation({
          latitude: currentPos.coords.latitude,
          longitude: currentPos.coords.longitude,
          city: place.city || place.subregion,
          address: place.street || place.name || 'Current Location',
        });
      }
    } catch (err) {
      setError('Failed to get location. Make sure GPS is enabled.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError('Please enter an event title.');
    if (!location) return setError('Please add an event location.');
    if (!asset) return setError('Please upload an event cover image.');
    
    setError(null);
    setIsPosting(true);

    try {
      // Combine Date and Time
      const startDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );

      const uploaded = await cloudinaryService.uploadImage(asset, { folder: 'events' });
      const bannerUrl = uploaded.secureUrl;

      const eventId = await firestoreService.createEvent({
        creatorId: user.uid,
        title,
        description,
        bannerUrl,
        location,
        radiusMeters: 5000, // Default 5km radius for visibility
        startTime: startDateTime,
        endTime: new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000), // Default 2 hours later
        status: 'published',
      });

      prependEvent({
        id: eventId,
        creatorId: user.uid,
        title: title.trim(),
        description: description.trim(),
        bannerUrl,
        location,
        startTime: startDateTime,
        participantCount: 0,
        createdAt: new Date(),
      });

      navigation.navigate('Events');
    } catch (err) {
      setError(err.message || 'Failed to create event. Try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && !!location && !!asset && !isPosting;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Event Name..."
        placeholderTextColor="#CBD5E1"
        style={styles.eventNameInput}
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.dateTimeRow}>
        <Pressable style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
          <Ionicons color={colors.neutral} name="calendar-outline" size={20} />
          <Text style={styles.dateTimeText}>{date.toLocaleDateString()}</Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
        )}

        <Pressable style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
          <Ionicons color={colors.neutral} name="time-outline" size={20} />
          <Text style={styles.dateTimeText}>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </Pressable>
        {showTimePicker && (
          <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />
        )}
      </View>

      <Pressable style={styles.eventLocationButton} onPress={handleGetLocation} disabled={isFetchingLocation}>
        <Ionicons color={colors.primary} name="location" size={18} />
        <View style={styles.locationTextContainer}>
          {isFetchingLocation ? (
            <Text style={styles.eventLocationText}>Locating...</Text>
          ) : location ? (
            <>
              <Text style={styles.eventLocationText}>{location.address}</Text>
              <Text style={styles.eventLocationSub}>{location.city}</Text>
            </>
          ) : (
            <Text style={styles.eventLocationText}>Choose Event Location</Text>
          )}
        </View>
        {location && <Ionicons name="checkmark-circle" color={colors.primary} size={18} />}
      </Pressable>

      <TextInput
        multiline
        placeholder="What's this event about?"
        placeholderTextColor="#CBD5E1"
        style={styles.eventDescriptionInput}
        value={description}
        onChangeText={setDescription}
      />

      {!asset ? (
        <Pressable style={styles.eventCoverButton} onPress={handlePickImage}>
          <View style={styles.eventCoverIconContainer}>
            <Ionicons color={colors.primary} name="add" size={20} />
          </View>
          <Text style={styles.eventCoverText}>Upload Event Cover</Text>
        </Pressable>
      ) : (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: asset.uri }} style={styles.imagePreview} />
          <Pressable style={styles.removeImageButton} onPress={() => setAsset(null)}>
            <Ionicons color={colors.text} name="close-circle" size={20} />
          </Pressable>
        </View>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Internal Footer for Submit */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        >
          {isPosting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.submitButtonText}>CREATE EVENT</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  eventNameInput: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    marginBottom: spacing.xl,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  dateTimeButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  dateTimeText: {
    color: colors.neutral,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  eventLocationButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    padding: spacing.md,
  },
  locationTextContainer: {
    flex: 1,
  },
  eventLocationText: {
    color: colors.text,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
  },
  eventLocationSub: {
    color: colors.mutedText,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  eventDescriptionInput: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    marginBottom: spacing.xl,
    minHeight: 120,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  eventCoverButton: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: radius.sm,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 160,
    justifyContent: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  eventCoverIconContainer: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: radius.sm,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: 40,
  },
  eventCoverText: {
    color: colors.neutral,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  imagePreviewContainer: {
    height: 160,
    width: '100%',
    marginBottom: spacing.xl,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginBottom: spacing.md,
  },
  footer: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
  },
  submitButtonDisabled: {
    backgroundColor: colors.border,
  },
  submitButtonText: {
    color: colors.surface,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 1,
  },
});
