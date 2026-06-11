// src/navigation/MainTabs.js
// 4 tab chính: Discover (M2) | Browse (M4) | Map (M3) | Profile (M1+M5)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import BrowseScreen from '../screens/experience/BrowseScreen';
import ExperienceDetailScreen from '../screens/experience/ExperienceDetailScreen';
import MapScreen from '../screens/map/MapScreen';
import ProfileScreen from '../screens/auth/ProfileScreen';
import { colors } from '../utils/theme';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BrowseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BrowseList" component={BrowseScreen} options={{ title: 'Khám phá' }} />
      <Stack.Screen
        name="ExperienceDetail"
        component={ExperienceDetailScreen}
        options={{ title: 'Chi tiết' }}
      />
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
      }}
    >
      <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Gợi ý' }} />
      <Tab.Screen name="Browse" component={BrowseStack} options={{ title: 'Danh sách' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'Bản đồ' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Cá nhân' }} />
    </Tab.Navigator>
  );
}
