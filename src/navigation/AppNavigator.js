import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';

export function AppNavigator() {
  return (
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}
