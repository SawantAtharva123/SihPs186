import { useEffect, useState } from 'react';
import { useSahayak } from '../context/SahayakContext';

export function useConnectivity() {
  const { isOffline } = useSahayak();
  return { isConnected: !isOffline };
}
