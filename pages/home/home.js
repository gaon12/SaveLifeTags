// pages/home/home.js
import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Main from './tabs/main';
import ServiceLogs from './tabs/servicelogs';
import Settings from './tabs/settings';
import { ThemeContext } from '../../context/ThemeContext';
import { LanguageContext } from '../../context/LanguageContext';

const Tab = createBottomTabNavigator();

export default function Home() {
  const { themeColor, darkMode } = useContext(ThemeContext);
  const { getTranslation } = useContext(LanguageContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Main') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ServiceLogs') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: themeColor,
        tabBarInactiveTintColor: darkMode ? '#888' : 'gray',
        tabBarStyle: {
          backgroundColor: darkMode ? '#333' : '#fff',
        },
      })}
    >
      <Tab.Screen name="Main" component={Main} options={{ title: getTranslation('main') }} />
      <Tab.Screen name="ServiceLogs" component={ServiceLogs} options={{ title: getTranslation('serviceLogs') }} />
      <Tab.Screen name="Settings" component={Settings} options={{ title: getTranslation('settings') }} />
    </Tab.Navigator>
  );
}
