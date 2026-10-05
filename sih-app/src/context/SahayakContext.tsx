import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserRole, DemoScenario } from '@/types/sahayak';
import { AuthUser } from '@/services/auth';
import {
  checkMLHealth,
  isDeviceOffline,
  subscribeToNetworkEvents,
  MLConnectionStatus,
  MLHealthDetails,
} from '@/services/mlHealth';
import { BASE_URL } from '@/services/analyticsClient';

interface SahayakContextProps {
  role: UserRole;
  setRole: (role: UserRole) => void;
  scenario: DemoScenario;
  setScenario: (scenario: DemoScenario) => void;
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;
  /** The currently authenticated user, or null if not logged in. */
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;

  // ML Service Live Indicator & Health properties
  mlStatus: MLConnectionStatus;
  mlDetails: MLHealthDetails;
  isManualOffline: boolean;
  setIsManualOffline: (manual: boolean) => void;
  pingMLService: () => Promise<MLHealthDetails>;
}

const SahayakContext = createContext<SahayakContextProps | undefined>(undefined);

export const SahayakProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('personnel');
  const [scenario, setScenario] = useState<DemoScenario>('scenario_a_stable');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Manual offline toggle (for testing/demo offline simulation)
  const [isManualOffline, setIsManualOffline] = useState<boolean>(false);

  // Real-time ML Service Health
  const [mlStatus, setMlStatus] = useState<MLConnectionStatus>(() =>
    isDeviceOffline() ? 'offline' : 'checking'
  );
  const [mlDetails, setMlDetails] = useState<MLHealthDetails>({
    status: isDeviceOffline() ? 'offline' : 'checking',
    latencyMs: null,
    lastChecked: null,
    serviceUrl: BASE_URL,
  });

  const pingMLService = useCallback(async (): Promise<MLHealthDetails> => {
    if (isManualOffline) {
      const details: MLHealthDetails = {
        status: 'offline',
        latencyMs: null,
        lastChecked: new Date(),
        serviceUrl: BASE_URL,
        error: 'Manual offline simulation active',
      };
      setMlStatus('offline');
      setMlDetails(details);
      return details;
    }

    if (isDeviceOffline()) {
      const details: MLHealthDetails = {
        status: 'offline',
        latencyMs: null,
        lastChecked: new Date(),
        serviceUrl: BASE_URL,
        error: 'Device is offline',
      };
      setMlStatus('offline');
      setMlDetails(details);
      return details;
    }

    setMlStatus('checking');
    const result = await checkMLHealth(4500);
    setMlStatus(result.status);
    setMlDetails(result);
    return result;
  }, [isManualOffline]);

  // Backward-compatible toggle for isOffline
  const setIsOffline = useCallback(
    (offline: boolean) => {
      setIsManualOffline(offline);
      if (offline) {
        setMlStatus('offline');
        setMlDetails((prev) => ({
          ...prev,
          status: 'offline',
          lastChecked: new Date(),
          error: 'Manual offline simulation active',
        }));
      } else {
        // Turning offline mode off -> immediately ping the ML service
        setTimeout(() => {
          pingMLService();
        }, 50);
      }
    },
    [pingMLService]
  );

  // Computed isOffline: true if user enabled manual offline OR device is physically offline
  const isOffline = isManualOffline || mlStatus === 'offline';

  // Mount effect: initial ping & subscribe to browser network events
  useEffect(() => {
    pingMLService();

    const unsubscribe = subscribeToNetworkEvents(
      () => {
        // Device came online
        if (!isManualOffline) {
          pingMLService();
        }
      },
      () => {
        // Device went offline
        setMlStatus('offline');
        setMlDetails((prev) => ({
          ...prev,
          status: 'offline',
          lastChecked: new Date(),
          error: 'Device network disconnected',
        }));
      }
    );

    // Periodic health check every 25 seconds (or 15 seconds if disconnected to catch server wake-up)
    const interval = setInterval(() => {
      if (!isManualOffline) {
        pingMLService();
      }
    }, mlStatus === 'disconnected' ? 15000 : 25000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isManualOffline, mlStatus, pingMLService]);

  return (
    <SahayakContext.Provider
      value={{
        role,
        setRole,
        scenario,
        setScenario,
        isOffline,
        setIsOffline,
        currentUser,
        setCurrentUser,
        mlStatus,
        mlDetails,
        isManualOffline,
        setIsManualOffline,
        pingMLService,
      }}
    >
      {children}
    </SahayakContext.Provider>
  );
};

export const useSahayak = () => {
  const context = useContext(SahayakContext);
  if (!context) {
    throw new Error('useSahayak must be used within a SahayakProvider');
  }
  return context;
};
