import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DateTimePickerBox from '../../components/event/DateTimePickerBox';
import ScreenHeader from '../../components/common/ScreenHeader';
import { useLocation } from '../../hooks/useLocation';
import { colors, radius, spacing } from '../../utils/theme';
import { imagePickerService } from '../../services/imagePickerService';
import { cloudinaryService } from '../../services/cloudinaryService';
import { firestoreService } from '../../services/firestoreService';
import { useEventStore } from '../../stores/eventStore';

export default function EditEventScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const eventId = route.params?.eventId;
  const events = useEventStore((s) => s.events);
  const updateEventStore = useEventStore((s) => s.updateEvent);

  const event = events.find((e) => e.id === eventId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [asset, setAsset] = useState(null);

  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [endDate, setEndDate] = useState(new Date());
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endTime, setEndTime] = useState(new Date());
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const { location: newLocation, isFetchingLocation, locationError, handleGetLocation, clearLocation } = useLocation();

  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      if (event.bannerUrl) setAsset({ uri: event.bannerUrl });

      const startD = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
      const endD = event.endTime?.toDate ? event.endTime.toDate() : (event.endTime ? new Date(event.endTime) : startD);

      setDate(startD);
      setTime(startD);
      setEndDate(endD);
      setEndTime(endD);
      setCurrentLocation(event.location);
    }
  }, [event]);

  useEffect(() => {
    if (newLocation) {
      setCurrentLocation(newLocation);
    }
  }, [newLocation]);

  if (!event) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  const handlePickImage = async () => {
    setError(null);
    try {
      const picked = await imagePickerService.fromLibrary();
      if (picked) setAsset(picked);
    } catch (err) {
      setError(err.message);
    }
  };

  const onDateChange = (e, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const onTimeChange = (e, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) setTime(selectedTime);
  };

  const onEndDateChange = (e, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  const onEndTimeChange = (e, selectedTime) => {
    setShowEndTimePicker(false);
    if (selectedTime) setEndTime(selectedTime);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsPosting(true);

    try {
      const startDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );

      const endDateTime = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
        endTime.getHours(),
        endTime.getMinutes()
      );

      let bannerUrl = event.bannerUrl;
      if (asset && asset.uri && !asset.uri.startsWith('http')) {
        const uploaded = await cloudinaryService.uploadImage(asset, { folder: 'events' });
        bannerUrl = uploaded.secureUrl;
      } else if (!asset) {
        bannerUrl = '';
      }

      const updateData = {
        title,
        description,
        bannerUrl,
        location: currentLocation,
        startTime: startDateTime,
        endTime: endDateTime,
      };

      await firestoreService.updateEvent(eventId, updateData);
      updateEventStore(eventId, updateData);

      navigation.goBack();
    } catch (err) {
      setError(err.message || 'Failed to update event. Try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !!currentLocation && !!asset && !isPosting;

  return (
    <View style={styles.screen}>
      <ScreenHeader showBack title="Edit Event" />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TextInput
        placeholder="Event Name..."
        placeholderTextColor="#CBD5E1"
        style={styles.eventNameInput}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.inputLabel}>Event Dates</Text>
      <DateTimePickerBox
        val1={date}
        val2={endDate}
        showPicker1={showDatePicker}
        showPicker2={showEndDatePicker}
        setShowPicker1={setShowDatePicker}
        setShowPicker2={setShowEndDatePicker}
        onChange1={onDateChange}
        onChange2={onEndDateChange}
        mode="date"
        icon="calendar-outline"
      />

      <Text style={styles.inputLabel}>Operating Hours</Text>
      <DateTimePickerBox
        val1={time}
        val2={endTime}
        showPicker1={showTimePicker}
        showPicker2={showEndTimePicker}
        setShowPicker1={setShowTimePicker}
        setShowPicker2={setShowEndTimePicker}
        onChange1={onTimeChange}
        onChange2={onEndTimeChange}
        mode="time"
        icon="time-outline"
      />

      <Pressable style={styles.eventLocationButton} onPress={handleGetLocation} disabled={isFetchingLocation}>
        <Ionicons color={colors.primary} name="location" size={18} />
        <View style={styles.locationTextContainer}>
          {isFetchingLocation ? (
            <Text style={styles.eventLocationText}>Locating...</Text>
          ) : currentLocation ? (
            <>
              <Text style={styles.eventLocationText}>{currentLocation.address}</Text>
              <Text style={styles.eventLocationSub}>{currentLocation.city}</Text>
            </>
          ) : (
            <Text style={styles.eventLocationText}>Choose Event Location</Text>
          )}
        </View>
        {currentLocation && <Ionicons name="checkmark-circle" color={colors.primary} size={18} />}
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

      {error || locationError ? <Text style={styles.errorText}>{error || locationError}</Text> : null}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Pressable
          disabled={!canSubmit}
          onPress={handleSubmit}
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        >
          {isPosting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}>UPDATE EVENT</Text>
          )}
        </Pressable>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  eventNameInput: {
    color: colors.text,
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    marginBottom: spacing.xl,
  },
  inputLabel: {
    color: colors.text,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    marginBottom: spacing.sm,
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
    padding: 2,
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
  submitButtonTextDisabled: {
    color: '#94A3B8',
  },
});
