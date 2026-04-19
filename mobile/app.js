// =============================================================================
// App.js
// Main Entry Point — React Native Navigation Setup
// Project: Bijli-Dost — AI Electricity Slab Scheduler
// =============================================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import HomeScreen      from './screens/HomeScreen';
import ApplianceScreen from './screens/ApplianceScreen';
import ResultScreen    from './screens/ResultScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0a0f',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#00d4ff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          cardStyle: {
            backgroundColor: '#0a0a0f',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '⚡ Bijli-Dost' }}
        />
        <Stack.Screen
          name="Appliances"
          component={ApplianceScreen}
          options={{ title: '🏠 Select Appliances' }}
        />
        <Stack.Screen
          name="Result"
          component={ResultScreen}
          options={{ title: '🎯 AI Schedule' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}