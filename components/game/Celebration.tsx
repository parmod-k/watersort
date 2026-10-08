import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { liquidGradients, liquidOrder } from '../../theme/tokens';

const CONFETTI_COLORS = liquidOrder.map((c) => liquidGradients[c]?.[0] ?? '#FFFFFF');

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** A four-pointed twinkle: two tapered bars crossed over a bright core. */
export function SparkleShape({ size, color = '#FFFFFF' }: { size: number; color?: string }) {
  const bar = Math.max(2, size * 0.16);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.bar, { width: bar, height: size, borderRadius: bar, backgroundColor: color }]} />
      <View style={[styles.bar, { width: size, height: bar, borderRadius: bar, backgroundColor: color }]} />
      <View
        style={{
          width: size * 0.38,
          height: size * 0.38,
          backgroundColor: color,
          transform: [{ rotate: '45deg' }],
          borderRadius: size * 0.06,
        }}
      />
    </View>
  );
}

type FieldProps = {
  /** How many sparkles twinkle in the field. */
  count?: number;
  colors?: string[];
  style?: StyleProp<ViewStyle>;
};

/** Sparkles that keep twinkling at random spots across their (absolutely filled) parent. */
export function SparkleField({ count = 14, colors = ['#FFFFFF', '#FDE047', '#FEF3C7'], style }: FieldProps) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: `${rand(2, 92)}%` as const,
        top: `${rand(2, 92)}%` as const,
        size: rand(10, 22),
        color: colors[i % colors.length],
        delay: rand(0, 1600),
        duration: rand(700, 1200),
        pause: rand(300, 1400),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );
  const values = useRef(items.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.sequence([
        Animated.delay(items[i].delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: items[i].duration / 2, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(v, { toValue: 0, duration: items[i].duration / 2, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            Animated.delay(items[i].pause),
          ]),
        ),
      ]),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {items.map((it, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: it.left,
            top: it.top,
            opacity: values[i],
            transform: [
              { scale: values[i].interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
              { rotate: values[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
            ],
          }}
        >
          <SparkleShape size={it.size} color={it.color} />
        </Animated.View>
      ))}
    </View>
  );
}

type BurstProps = { size?: number; count?: number; color?: string; delay?: number };

/** A one-shot ring of sparkles flying out from the centre of its parent, e.g. when a star lands. */
export function SparkleBurst({ size = 90, count = 8, color = '#FDE047', delay = 0 }: BurstProps) {
  const t = useRef(new Animated.Value(0)).current;
  const rays = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + rand(-0.2, 0.2);
        const dist = (size / 2) * rand(0.75, 1.1);
        return { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist, s: rand(8, 14) };
      }),
    [count, size],
  );

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(t, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={styles.burstCenter}>
      {rays.map((r, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            opacity: t.interpolate({ inputRange: [0, 0.05, 0.6, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, r.dx] }) },
              { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, r.dy] }) },
              { scale: t.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1, 0.4] }) },
            ],
          }}
        >
          <SparkleShape size={r.s} color={i % 2 ? '#FFFFFF' : color} />
        </Animated.View>
      ))}
    </View>
  );
}

/** Confetti that bursts up from the bottom corners and flutters down across the whole screen, once. */
export function Confetti({ count = 46 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const fromLeft = i % 2 === 0;
        return {
          startX: fromLeft ? rand(-10, width * 0.15) : rand(width * 0.85, width + 10),
          // Arc up and across toward the middle, then drift down past the bottom edge.
          peakX: fromLeft ? rand(width * 0.1, width * 0.75) : rand(width * 0.25, width * 0.9),
          endX: fromLeft ? rand(width * 0.05, width * 0.9) : rand(width * 0.1, width * 0.95),
          peakY: rand(height * 0.05, height * 0.4),
          w: rand(6, 11),
          h: rand(10, 16),
          round: Math.random() < 0.3,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          spin: rand(2, 5) * (Math.random() < 0.5 ? -1 : 1),
          flips: rand(3, 7),
          delay: rand(0, 350),
          duration: rand(2600, 3600),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count],
  );
  const values = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel(
      values.map((v, i) =>
        Animated.sequence([
          Animated.delay(pieces[i].delay),
          Animated.timing(v, { toValue: 1, duration: pieces[i].duration, easing: Easing.linear, useNativeDriver: true }),
        ]),
      ),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 50, elevation: 50 }]}>
      {pieces.map((p, i) => {
        const v = values[i];
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: p.w,
              height: p.round ? p.w : p.h,
              borderRadius: p.round ? p.w / 2 : 2,
              backgroundColor: p.color,
              opacity: v.interpolate({ inputRange: [0, 0.02, 0.85, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: v.interpolate({ inputRange: [0, 0.22, 1], outputRange: [p.startX, p.peakX, p.endX] }) },
                // Fast launch, a hang at the top, then a gentle gravity fall.
                {
                  translateY: v.interpolate({
                    inputRange: [0, 0.22, 0.3, 1],
                    outputRange: [height + 20, p.peakY, p.peakY + 12, height + 40],
                    easing: Easing.inOut(Easing.quad),
                  }),
                },
                { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin * 360}deg`] }) },
                // Flipping edge-on and back reads as paper fluttering.
                {
                  scaleX: v.interpolate({
                    inputRange: Array.from({ length: 9 }, (_, k) => k / 8),
                    outputRange: Array.from({ length: 9 }, (_, k) => Math.cos((k / 8) * Math.PI * p.flips)),
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute' },
  burstCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
