import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SahayakProvider, useSahayak } from '@/context/SahayakContext';
import Header from '@/components/Header';
import { getDatabase } from '@/offline/database';
import { getSession } from '@/services/auth';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { role, setRole, setCurrentUser } = useSahayak();
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
      {!inAuthGroup && <Header />}
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <SahayakProvider>
      <AppContent />
    </SahayakProvider>
  );
}

