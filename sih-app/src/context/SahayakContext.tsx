import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, DemoScenario } from '@/types/sahayak';
import { AuthUser } from '@/services/auth';

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
}

const SahayakContext = createContext<SahayakContextProps | undefined>(undefined);

export const SahayakProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>('personnel');
  const [scenario, setScenario] = useState<DemoScenario>('scenario_a_stable');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

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
