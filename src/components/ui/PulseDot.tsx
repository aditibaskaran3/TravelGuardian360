/**
 * PulseDot — a small "live" indicator: a coloured dot with a soft, repeating
 * halo pulse. Used to signal an active real-time state (e.g. live tracking).
 *
 * Uses React Native's built-in Animated API (no Reanimated worklets) so it is
 * unaffected by this project's custom Babel config (see build-env notes).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';

type PulseDotProps = {
  /** Tailwind bg-* class for the dot + halo colour. */
  colorClass?: string;
  /** Dot diameter in px. */
  size?: number;
  /** When false, renders a static dot with no animation. */
  active?: boolean;
};

export default function PulseDot({
  colorClass = 'bg-emerald-500',
  size = 10,
  active = true,
}: PulseDotProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, progress]);

  const haloOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });
  const haloScale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 3] });

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {active && (
        <Animated.View
          style={{
            width: size,
            height: size,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          }}
          className={`absolute rounded-full ${colorClass}`}
        />
      )}
      <View style={{ width: size, height: size }} className={`rounded-full ${colorClass}`} />
    </View>
  );
}
