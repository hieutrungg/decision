import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/context/AuthContext';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation/RootNavigator';
import { paperTheme } from './src/utils/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <UserProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </UserProvider>
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
