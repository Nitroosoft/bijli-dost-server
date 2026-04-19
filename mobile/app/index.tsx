import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { LanguageProvider } from '../LanguageContext';

import AuthScreen        from '../screens/AuthScreen';
import HomeScreen        from '../screens/HomeScreen';
import ApplianceScreen   from '../screens/ApplianceScreen';
import ResultScreen      from '../screens/ResultScreen';
import BillScannerScreen from '../screens/BillScannerScreen';

const Stack = createStackNavigator();

export default function Index() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [userName,     setUserName]     = useState<string>('');

  useEffect(() => {
    const checkName = async () => {
      try {
        const saved = await SecureStore.getItemAsync('bd_username');
        if (saved) {
          setUserName(saved);
          setInitialRoute('Home');
        } else {
          setInitialRoute('Auth');
        }
      } catch {
        setInitialRoute('Auth');
      }
    };
    checkName();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f',
                     alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle     : { backgroundColor: '#0a0a0f', elevation: 0, shadowOpacity: 0 },
          headerTintColor : '#00d4ff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          cardStyle       : { backgroundColor: '#0a0a0f' },
        }}
      >
        <Stack.Screen name="Auth" component={AuthScreen}
          options={{ headerShown: false }} />

        <Stack.Screen name="Home" component={HomeScreen}
          initialParams={{ userName }}
          options={({ route }: any) => ({
            title: '⚡ Bijli-Dost',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => route.params?.onToggleLanguage?.()}
                style={{
                  marginRight: 16,
                  backgroundColor: '#00d4ff12',
                  borderWidth: 1,
                  borderColor: '#00d4ff33',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}>
                <Text style={{ color: '#00d4ff', fontWeight: '700', fontSize: 12 }}>
                  🌐 ENG / اُردُو / پښتو
                </Text>
              </TouchableOpacity>
            ),
          })}
        />

        <Stack.Screen name="Appliances" component={ApplianceScreen}
          options={{ title: '🏠 Appliances' }} />
        <Stack.Screen name="Result" component={ResultScreen}
          options={{ title: '🎯 AI Schedule' }} />
        <Stack.Screen name="BillScanner" component={BillScannerScreen}
          options={{ title: '📸 Bill Scanner' }} />
      </Stack.Navigator>
    </LanguageProvider>
  );
}