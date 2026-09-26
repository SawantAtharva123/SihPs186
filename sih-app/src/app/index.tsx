import React from 'react';
import { Redirect } from 'expo-router';
import { useSahayak } from '@/context/SahayakContext';

export default function Index() {
  const { role } = useSahayak();

  if (role === 'personnel') {
    return <Redirect href="/(personnel)" />;
  } else if (role === 'welfare_officer') {
    return <Redirect href="/(welfare)" />;
  } else if (role === 'command_admin') {
    return <Redirect href="/(command)" />;
  }

  // Fallback
  return <Redirect href="/(personnel)" />;
}
