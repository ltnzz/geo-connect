import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './MainTabNavigator';
import ConnectionsScreen from '../screens/profile/ConnectionsScreen';
import NotificationScreen from '../screens/notification/NotificationScreen';
import PostDetailScreen from '../screens/post/PostDetailScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import EventDetailScreen from '../screens/event/EventDetailScreen';
import SearchScreen from '../screens/search/SearchScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="Connections" component={ConnectionsScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="PostDetail" component={PostDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
