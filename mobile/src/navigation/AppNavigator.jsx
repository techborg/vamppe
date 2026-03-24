import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/theme';

// Auth screens
import Landing from '../screens/Landing';
import Login from '../screens/Login';
import Register from '../screens/Register';

// App screens
import Home from '../screens/Home';
import Explore from '../screens/Explore';
import Notifications from '../screens/Notifications';
import Chat from '../screens/Chat';
import ChatRoom from '../screens/ChatRoom';
import Profile from '../screens/Profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:          { active: '⌂',  inactive: '⌂'  },
  Discover:      { active: '◎',  inactive: '◎'  },
  Activity:      { active: '🔔', inactive: '🔔' },
  Messages:      { active: '💬', inactive: '💬' },
};

const screenOpts = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700', fontSize: 16 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

function MainTabs({ navigation }) {
  const { user } = useAuth();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...screenOpts,
        tabBarStyle: {
          backgroundColor: colors.surface1,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.orange,
        tabBarInactiveTintColor: colors.gray4,
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ color, fontSize: 10, fontWeight: focused ? '700' : '400' }}>
            {route.name}
          </Text>
        ),
        tabBarIcon: ({ focused }) => {
          const icons = TAB_ICONS[route.name];
          return (
            <Text style={{ fontSize: 20, color: focused ? colors.orange : colors.gray4 }}>
              {focused ? icons?.active : icons?.inactive}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Discover" component={Explore} />
      <Tab.Screen name="Activity" component={Notifications} />
      <Tab.Screen name="Messages" component={Chat} />
    </Tab.Navigator>
  );
}

function AppStack() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={screenOpts}>
      {!user ? (
        <>
          <Stack.Screen name="Landing" component={Landing} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Profile" component={Profile} options={{ title: 'Profile' }} />
          <Stack.Screen name="ChatRoom" component={ChatRoom} options={({ route }) => ({ title: route.params?.username || 'Chat' })} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AppStack />
    </NavigationContainer>
  );
}
