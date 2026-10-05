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
  pingMLService: (options?: { showChecking?: boolean }) => Promise<MLHealthDetails>;
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

  const isCheckingRef = React.useRef(false);
  const mlStatusRef = React.useRef<MLConnectionStatus>(isDeviceOffline() ? 'offline' : 'checking');
  const mlDetailsRef = React.useRef<MLHealthDetails>({
    status: isDeviceOffline() ? 'offline' : 'checking',
    latencyMs: null,
    lastChecked: null,
    serviceUrl: BASE_URL,
  });
  const isManualOfflineRef = React.useRef(isManualOffline);
  isManualOfflineRef.current = isManualOffline;

  const pingMLService = useCallback(
    async (options?: { showChecking?: boolean }): Promise<MLHealthDetails> => {
      // Prevent overlapping concurrent checks
      if (isCheckingRef.current) {
        return mlDetailsRef.current;
      }
      isCheckingRef.current = true;

      try {
        if (isManualOfflineRef.current) {
          const details: MLHealthDetails = {
            status: 'offline',
            latencyMs: null,
            lastChecked: new Date(),
            serviceUrl: BASE_URL,
            error: 'Manual offline simulation active',
          };
          if (mlStatusRef.current !== 'offline') {
            mlStatusRef.current = 'offline';
            setMlStatus('offline');
          }
          mlDetailsRef.current = details;
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
          if (mlStatusRef.current !== 'offline') {
            mlStatusRef.current = 'offline';
            setMlStatus('offline');
          }
          mlDetailsRef.current = details;
          setMlDetails(details);
          return details;
        }

        // Only show 'checking' if explicitly requested (e.g. manual user retry)
        // or on initial mount when no status has ever been resolved
        if (options?.showChecking || mlStatusRef.current === 'checking') {
          if (mlStatusRef.current !== 'checking') {
            mlStatusRef.current = 'checking';
            setMlStatus('checking');
          }
        }

        const timeout = options?.showChecking ? 12000 : 9000;
        const result = await checkMLHealth(timeout);

        // ONLY update mlStatus badge if the status actually changed (prevents UI flicker)
        if (mlStatusRef.current !== result.status) {
          mlStatusRef.current = result.status;
          setMlStatus(result.status);
        }

        // Always update details (timestamp, latency, error) so diagnostics modal stays fresh
        mlDetailsRef.current = result;
        setMlDetails(result);

        return result;
      } finally {
        isCheckingRef.current = false;
      }
    },
    []
  );

  // Backward-compatible toggle for isOffline
  const setIsOffline = useCallback(
    (offline: boolean) => {
      setIsManualOffline(offline);
      isManualOfflineRef.current = offline;
      if (offline) {
        mlStatusRef.current = 'offline';
        setMlStatus('offline');
        const details: MLHealthDetails = {
          ...mlDetailsRef.current,
          status: 'offline',
          lastChecked: new Date(),
          error: 'Manual offline simulation active',
        };
        mlDetailsRef.current = details;
        setMlDetails(details);
      } else {
        // Turning offline mode off -> immediately ping the ML service
        setTimeout(() => {
          pingMLService({ showChecking: true });
        }, 50);
      }
    },
    [pingMLService]
  );

  // Computed isOffline: true if user enabled manual offline OR device is physically offline
  const isOffline = isManualOffline || mlStatus === 'offline';

  // Mount effect: initial ping & subscribe to browser network events
  useEffect(() => {
    // Initial health check on mount
    pingMLService({ showChecking: mlStatusRef.current === 'checking' });

    const unsubscribe = subscribeToNetworkEvents(
      () => {
        // Device came online
        if (!isManualOfflineRef.current) {
          pingMLService({ showChecking: false });
        }
      },
      () => {
        // Device went offline
        mlStatusRef.current = 'offline';
        setMlStatus('offline');
        const details: MLHealthDetails = {
          ...mlDetailsRef.current,
          status: 'offline',
          lastChecked: new Date(),
          error: 'Device network disconnected',
        };
        mlDetailsRef.current = details;
        setMlDetails(details);
      }
    );

    // Periodic silent health check every 15 seconds (without setting 'checking' state)
    const interval = setInterval(() => {
      if (!isManualOfflineRef.current) {
        pingMLService({ showChecking: false });
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [pingMLService]);

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
