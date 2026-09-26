import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F1F5F9',
    backgroundTertiary: '#F1F5F9',
    card: '#FFFFFF',
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    primary: '#0F766E', // Calming Teal
    primaryHover: '#115E59',
    primaryLight: '#CCFBF1',
    navy: '#0A192F',
    navySurface: '#1E293B',
    accent: '#2563EB', // Blue
    accentLight: '#DBEAFE',
    
    // Welfare State Palette (Non-alarmist, dignified)
    stateStable: '#059669', // Emerald
    stateStableBg: '#ECFDF5',
    stateEmerging: '#0284C7', // Sky Blue
    stateEmergingBg: '#F0F9FF',
    stateConflicting: '#7C3AED', // Violet
    stateConflictingBg: '#F5F3FF',
    statePersistent: '#D97706', // Amber
    statePersistentBg: '#FFFBEB',
    stateSustained: '#E11D48', // Respectful Rose (not glaring red)
    stateSustainedBg: '#FFF1F2',

    // Status helpers
    warning: '#D97706',
    warningBg: '#FEF3C7',
    success: '#059669',
    successBg: '#D1FAE5',
    info: '#2563EB',
    infoBg: '#DBEAFE',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    background: '#090D16',
    backgroundElement: '#131B2E',
    backgroundSelected: '#1E293B',
    backgroundTertiary: '#1A2338',
    card: '#131B2E',
    border: '#1E293B',
    borderSubtle: '#172033',
    primary: '#14B8A6',
    primaryHover: '#2DD4BF',
    primaryLight: '#042F2E',
    navy: '#020617',
    navySurface: '#0F172A',
    accent: '#3B82F6',
    accentLight: '#1E3A8A',

    // Welfare State Palette
    stateStable: '#34D399',
    stateStableBg: '#064E3B',
    stateEmerging: '#38BDF8',
    stateEmergingBg: '#082F49',
    stateConflicting: '#A78BFA',
    stateConflictingBg: '#2E1065',
    statePersistent: '#FBBF24',
    statePersistentBg: '#451A03',
    stateSustained: '#FB7185',
    stateSustainedBg: '#4C0519',

    warning: '#FBBF24',
    warningBg: '#451A03',
    success: '#34D399',
    successBg: '#064E3B',
    info: '#60A5FA',
    infoBg: '#1E3A8A',
  },
} as const;

export type ThemeColors = Record<keyof typeof Colors.light, string>;
export type ThemeColor = keyof ThemeColors;

export const Fonts = {
  regular: Platform.select({ ios: 'System', default: 'sans-serif' }),
  medium: Platform.select({ ios: 'System', default: 'sans-serif-medium' }),
  bold: Platform.select({ ios: 'System', default: 'sans-serif' }),
  mono: Platform.select({ ios: 'Menlo', default: 'monospace' }),
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadow = Platform.select({
  web: {
    sm: { boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
    md: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' },
    lg: { boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)' },
  },
  default: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },
  },
});

export const MaxContentWidth = 1080;
export const BottomTabInset = 70;
