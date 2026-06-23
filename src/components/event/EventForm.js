import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DateTimePickerBox from './DateTimePickerBox';
import LocationSelectModal from '../create/LocationSelectModal';
import { useLocation } from '../../hooks/useLocation';
import { useColors, radius, spacing } from '../../utils/theme';
import { imagePickerService } from '../../services/imagePickerService';

const EVENT_CATEGORIES = [
  'Music', 'Sports', 'Food & Drink', 'Arts', 'Networking', 'Technology', 'Community', 'Other'
];

export default function EventForm({
  initialValues,
  onSubmit,
  onChange,
  isPosting,
  submitButtonText,
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [asset, setAsset] = useState(null);
  const [category, setCategory] = useState(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d;
  });
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d;
  });
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const { location, isFetchingLocation, locationError, handleGetLocation } = useLocation();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    if (initialValues) {
      if (initialValues.title) setTitle(initialValues.title);
      if (initialValues.description) setDescription(initialValues.description);
      if (initialValues.bannerUrl) {
        setAsset({ uri: initialValues.bannerUrl });
      } else if (initialValues.asset?.uri) {
        setAsset({ uri: initialValues.asset.uri });
      }
      if (initialValues.category) setCategory(initialValues.category);
      
      if (initialValues.startTime) {
        const start = new Date(initialValues.startTime);
        setDate(start);
        setTime(start);
      }
      if (initialValues.endTime) {
        const end = new Date(initialValues.endTime);
        setEndDate(end);
        setEndTime(end);
      }
      if (initialValues.location) {
        setCurrentLocation(initialValues.location);
      }
    }
  }, [initialValues]);


  useEffect(() => {
    if (location && !currentLocation) {
      setCurrentLocation(location);
    }
  }, [location]);


  useEffect(() => {
    if (onChange) {
      onChange({
        title,
        description,
        asset,
        category,
        date,
        time,
        endDate,
        endTime,
        location: currentLocation,
      });
    }
  }, [title, description, asset, category, date, time, endDate, endTime, currentLocation]);

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

  const handleSubmit = () => {
    onSubmit({
      title,
      description,
      asset,
      category,
      location: currentLocation,
      date,
      time,
      endDate,
      endTime,
    });
  };

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !!currentLocation && !!asset && !!category && !isPosting;

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Event Name..."
        placeholderTextColor={colors.neutral}
        style={styles.eventNameInput}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.inputLabel}>Category</Text>
      <View style={styles.categoryScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
          {EVENT_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
            >
              <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextSelected]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

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

      <Pressable style={styles.eventLocationButton} onPress={() => setIsLocationModalVisible(true)} disabled={isFetchingLocation}>
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
        placeholderTextColor={colors.neutral}
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
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}>{submitButtonText}</Text>
          )}
        </Pressable>
      </View>

      <LocationSelectModal
        visible={isLocationModalVisible}
        onClose={() => setIsLocationModalVisible(false)}
        onSelect={(loc) => setCurrentLocation(loc)}
        currentUserLocation={location}
      />
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
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
  categoryScroll: {
    marginBottom: spacing.xl,
    marginLeft: -spacing.md,
    marginRight: -spacing.md,
  },
  categoryContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.mutedText,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  eventLocationButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
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
    borderColor: colors.border,
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
    backgroundColor: colors.primary + '1A',
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
    backgroundColor: colors.surface + 'CC',
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
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 1,
  },
  submitButtonTextDisabled: {
    color: colors.mutedText,
  },
});

