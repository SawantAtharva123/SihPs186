import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';

interface BouncyPressableProps extends PressableProps {
  children: React.ReactNode;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export default function BouncyPressable({
  children,
  scaleTo = 0.96,
  style,
  containerStyle,
  onPress,
  ...props
}: BouncyPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const flatStyle = StyleSheet.flatten(style) || {};

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      friction: 6,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 80,
    }).start();
  };

  const autoContainerStyle: ViewStyle = {};
  if (flatStyle.flex !== undefined) autoContainerStyle.flex = flatStyle.flex;
  if (flatStyle.alignSelf !== undefined) autoContainerStyle.alignSelf = flatStyle.alignSelf;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[autoContainerStyle, containerStyle]}
      {...props}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export { BouncyPressable };
