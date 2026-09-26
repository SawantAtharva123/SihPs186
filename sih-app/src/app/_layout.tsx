import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SahayakProvider, useSahayak } from '@/context/SahayakContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import Header from '@/components/Header';
import { getDatabase } from '@/offline/database';
import { getSession } from '@/services/auth';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const origError = console.error;
  console.error = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Unknown event handler property')) {
      return;
    }
    origError.apply(console, args);
  };
}

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { role, setRole, setCurrentUser } = useSahayak();
  const { isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await getDatabase(); // runs migrations
        const session = await getSession();
        if (session) {
          setRole(session.role);
          setCurrentUser(session);
        } else {
          router.replace('/(auth)/login');
        }
      } catch (e) {
        console.warn('Init error:', e);
      } finally {
        setInitialized(true);
        SplashScreen.hideAsync();
      }
    }
    init();
  }, []);

  if (!initialized) return null;

  const inAuthGroup = segments[0] === '(auth)';

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!inAuthGroup && <Header />}
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SahayakProvider>
        <AppContent />
      </SahayakProvider>
    </ThemeProvider>
  );
}

