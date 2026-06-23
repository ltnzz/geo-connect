import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors, radius, spacing } from '../../utils/theme';

export default function EventDetailFooter({
  isOwnEvent,
  response,
  onToggleGoing,
  onToggleInterested,
  onToggleNotGoing,
  onDelete,
  onEdit,
}) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (isOwnEvent) {
    return (
      <>
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={[styles.responseButton, styles.deleteButton]}
        >
          <Ionicons color={colors.danger} name="trash-outline" size={16} />
          <Text style={[styles.buttonText, { color: colors.danger }]}>Delete</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={[styles.responseButton, styles.goingButton, styles.goingSelected]}
        >
          <Ionicons color="#FFFFFF" name="pencil" size={16} />
          <Text style={[styles.goingText, styles.goingTextSelected]}>Edit Event</Text>
        </Pressable>
      </>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={onToggleNotGoing}
        style={[
          styles.responseButton,
          response === 'not_going' && styles.notGoingSelected,
        ]}
      >
        <Ionicons
          color={response === 'not_going' ? colors.danger : colors.neutral}
          name={response === 'not_going' ? 'close-circle' : 'close-circle-outline'}
          size={18}
        />
        <Text
          style={[
            styles.buttonText,
            response === 'not_going' && styles.notGoingTextSelected,
          ]}
        >
          Can't Go
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onToggleInterested}
        style={[
          styles.responseButton,
          response === 'interested' && styles.interestedSelected,
        ]}
      >
        <Ionicons
          color={response === 'interested' ? colors.tertiary : colors.neutral}
          name={response === 'interested' ? 'bookmark' : 'bookmark-outline'}
          size={16}
        />
        <Text
          style={[
            styles.buttonText,
            response === 'interested' && styles.interestedTextSelected,
          ]}
        >
          Interested
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={onToggleGoing}
        style={[
          styles.responseButton,
          styles.goingButton,
          response === 'going' && styles.goingSelected,
        ]}
      >
        <Ionicons
          color={response === 'going' ? '#FFFFFF' : colors.primary}
          name={response === 'going' ? 'checkmark-circle' : 'checkmark-circle-outline'}
          size={17}
        />
        <Text
          style={[
            styles.goingText,
            response === 'going' && styles.goingTextSelected,
          ]}
        >
          Going
        </Text>
      </Pressable>
    </>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  responseButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    justifyContent: 'center',
  },
  deleteButton: {
    borderColor: colors.danger + '33',
    backgroundColor: colors.danger + '1A',
  },
  interestedSelected: {
    backgroundColor: colors.tertiary + '1A',
    borderColor: colors.tertiary,
  },
  buttonText: {
    color: colors.neutral,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  interestedTextSelected: {
    color: colors.tertiary,
  },
  goingSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goingButton: {
    
  },
  notGoingSelected: {
    backgroundColor: colors.danger + '1A',
    borderColor: colors.danger,
  },
  notGoingTextSelected: {
    color: colors.danger,
  },
  goingText: {
    color: colors.primary,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  goingTextSelected: {
    color: '#FFFFFF',
  },
});

