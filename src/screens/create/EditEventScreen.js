import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';

import ScreenHeader from '../../components/common/ScreenHeader';
import EventForm from '../../components/event/EventForm';
import { cloudinaryService } from '../../services/cloudinaryService';
import { firestoreService } from '../../services/firestoreService';
import { useEventStore } from '../../stores/eventStore';
import { combineDateTime } from '../../utils/dateUtils';
import { colors, spacing } from '../../utils/theme';

export default function EditEventScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const eventId = route.params?.eventId;
  const events = useEventStore((s) => s.events);
  const updateEventStore = useEventStore((s) => s.updateEvent);

  const event = events.find((e) => e.id === eventId);

  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState(null);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (event) {
      const startD = event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime);
      const endD = event.endTime?.toDate ? event.endTime.toDate() : (event.endTime ? new Date(event.endTime) : startD);

      setInitialValues({
        title: event.title || '',
        description: event.description || '',
        bannerUrl: event.bannerUrl || null,
        location: event.location,
        startTime: startD,
        endTime: endD,
      });
    }
  }, [event]);

  if (!event) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  const handleSubmit = async (formData) => {
    setError(null);
    setIsPosting(true);

    try {
      const startDateTime = combineDateTime(formData.date, formData.time);
      const endDateTime = combineDateTime(formData.endDate, formData.endTime);

      let bannerUrl = event.bannerUrl;
      if (formData.asset && formData.asset.uri && !formData.asset.uri.startsWith('http')) {
        const uploaded = await cloudinaryService.uploadImage(formData.asset, { folder: 'events' });
        bannerUrl = uploaded.secureUrl;
      } else if (!formData.asset) {
        bannerUrl = '';
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        bannerUrl,
        location: formData.location,
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

  return (
    <View style={styles.screen}>
      <ScreenHeader showBack title="Edit Event" />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <EventForm
          initialValues={initialValues}
          submitButtonText="UPDATE EVENT"
          onSubmit={handleSubmit}
          isPosting={isPosting}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  errorText: {
    color: colors.danger,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
