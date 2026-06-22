import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback, useState, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';

import EventForm from '../../components/event/EventForm';
import { cloudinaryService } from '../../services/cloudinaryService';
import { firestoreService } from '../../services/firestoreService';
import { useAuthStore } from '../../stores/authStore';
import { useEventStore } from '../../stores/eventStore';
import { combineDateTime } from '../../utils/dateUtils';
import { useColors, spacing } from '../../utils/theme';

export default function CreateEventScreen({ initialDraft, onEventDataChange, onSuccess }) {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const prependEvent = useEventStore((s) => s.prependEvent);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFormKey((prev) => prev + 1);
        setError(null);
      };
    }, [])
  );

  const handleSubmit = async (formData) => {
    setError(null);
    setIsPosting(true);

    try {
      const startDateTime = combineDateTime(formData.date, formData.time);
      const endDateTime = combineDateTime(formData.endDate, formData.endTime);

      const uploaded = await cloudinaryService.uploadImage(formData.asset, { folder: 'events' });
      const bannerUrl = uploaded.secureUrl;

      const eventId = await firestoreService.createEvent({
        creatorId: user.uid,
        title: formData.title,
        description: formData.description,
        categoryId: formData.category,
        category: formData.category,
        bannerUrl,
        location: formData.location,
        radiusMeters: 5000, // Default 5km radius for visibility
        startTime: startDateTime,
        endTime: endDateTime,
        status: 'published',
      });

      prependEvent({
        id: eventId,
        creatorId: user.uid,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        bannerUrl,
        location: formData.location,
        startTime: startDateTime,
        endTime: endDateTime,
        participantCount: 0,
        createdAt: new Date(),
      });

      if (onSuccess) onSuccess();
      navigation.navigate('Events');
    } catch (err) {
      setError(err.message || 'Failed to create event. Try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <View style={styles.container}>
      <EventForm
        key={formKey}
        initialValues={initialDraft?.eventData}
        onChange={onEventDataChange}
        submitButtonText={initialDraft ? "UPDATE EVENT" : "CREATE EVENT"}
        onSubmit={handleSubmit}
        isPosting={isPosting}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
