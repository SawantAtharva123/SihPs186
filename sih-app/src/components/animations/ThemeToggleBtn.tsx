import React, { useRef, useEffect } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius } from '@/constants/theme';

interface ThemeToggleBtnProps {
  showLabel?: boolean;
}

export default function ThemeToggleBtn({ showLabel = false }: ThemeToggleBtnProps) {
  const { isDark, toggleTheme, colors } = useTheme();
  const rotation = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(rotation, {
        toValue: isDark ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      ]),
    ]).start();
  }, [isDark]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={toggleTheme}
      style={[
        styles.button,
        {
          backgroundColor: isDark ? '#1E293B' : colors.backgroundSelected,
          borderColor: isDark ? '#334155' : colors.border,
        },
      ]}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ rotate: spin }, { scale }] }}>
        <Ionicons
          name={isDark ? 'sunny' : 'moon'}
          size={18}
          color={isDark ? '#F59E0B' : '#6366F1'}
        />
      </Animated.View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {isDark ? 'Dark' : 'Light'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
