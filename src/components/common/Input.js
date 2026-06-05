import { StyleSheet, TextInput } from 'react-native';

export function Input(props) {
  return <TextInput placeholderTextColor="#94A3B8" style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 16,
  },
});
