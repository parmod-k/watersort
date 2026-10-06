import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Grad = [string, string, string];

type StreamProps = {
  /** Stage-relative x of the stream's centre (the pouring lip). */
  x: number;
  /** Stage-relative y of the pouring lip. */
  lipY: number;
  /** Stage-relative y of the target's liquid surface when the pour starts. */
  surfaceY: number;
  /** How far the target's surface climbs over the whole pour. */
  rise: number;
  /** Inner width of the target's glass; splashes and ripples stay inside it. */
  glassWidth: number;
  streamWidth: number;
  colors: Grad;
  /** 0 -> 1: the column falls from the lip; 1 -> 2: its tail drops into the target (native driver). */
  streamAnim: Animated.Value;
  /** 0 -> 1: the target fills (JS driver); the impact point rises with it. */
  growAnim: Animated.Value;
};

const DROPLETS = 7;

/** The falling stream of liquid plus the splash, droplets and ripples where it lands. */
export function PourStream({ x, lipY, surfaceY, rise, glassWidth, streamWidth, colors, streamAnim, growAnim }: StreamProps) {
  // The bottle's mouth is rounded, so start the stream a little above the pivot to meet the rim.
  const top = lipY - streamWidth * 1.5;
  const fall = Math.max(1, surfaceY - top);
  const wobble = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const drops = useRef(Array.from({ length: DROPLETS }, () => new Animated.Value(0))).current;

  // Each droplet gets its own arc so the splash never looks like a repeating pattern.
  const arcs = useMemo(
    () =>
      drops.map((_, i) => {
        const side = i % 2 === 0 ? 1 : -1;
        return {
          dx: side * glassWidth * (0.12 + Math.random() * 0.26),
          height: 8 + Math.random() * Math.min(18, glassWidth * 0.45),
          size: Math.max(2.5, streamWidth * (0.35 + Math.random() * 0.35)),
          duration: 360 + Math.random() * 220,
          delay: i * 55,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    const loops = [
      // The column narrows and swells slightly, like a real pour.
      Animated.loop(
        Animated.sequence([
          Animated.timing(wobble, { toValue: 1, duration: 110, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(wobble, { toValue: 0, duration: 130, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.timing(ripple, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ),
      ...drops.map((d, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(arcs[i].delay),
            Animated.timing(d, { toValue: 1, duration: arcs[i].duration, easing: Easing.linear, useNativeDriver: true }),
          ]),
        ),
      ),
    ];
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringH = Math.max(5, glassWidth * 0.2);
  const highlight = Math.max(1.5, streamWidth * 0.2);

  return (
    <>
      {/* Stream column: clipped to the gap between the lip and the (rising) surface. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layer,
          {
            left: x - streamWidth / 2,
            top,
            width: streamWidth,
            height: growAnim.interpolate({ inputRange: [0, 1], outputRange: [fall, Math.max(1, fall - rise)] }),
            overflow: 'hidden',
          },
        ]}
      >
        <Animated.View
          style={{
            height: fall,
            width: streamWidth,
            transform: [{ translateY: streamAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [-fall, 0, fall] }) }],
          }}
        >
          <Animated.View
            style={{ flex: 1, transform: [{ scaleX: wobble.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.06] }) }] }}
          >
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: streamWidth / 2 }]}
            />
            <View
              style={[
                styles.streamShine,
                { left: streamWidth * 0.22, width: highlight, borderRadius: highlight / 2 },
              ]}
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>

      {/* A rounded bead of liquid where the stream leaves the lip. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layer,
          {
            left: x - streamWidth * 0.8,
            top: top - streamWidth * 0.6,
            width: streamWidth * 1.6,
            height: streamWidth * 1.4,
            borderRadius: streamWidth,
            overflow: 'hidden',
            opacity: streamAnim.interpolate({ inputRange: [0, 0.15, 1, 1.15, 2], outputRange: [0, 1, 1, 0, 0] }),
          },
        ]}
      >
        <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>

      {/* Splash zone: rides up with the surface as the target fills. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.layer,
          styles.splashZone,
          {
            left: x - glassWidth / 2,
            top: surfaceY,
            width: glassWidth,
            transform: [{ translateY: growAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) }],
          },
        ]}
      >
        {/* Fades in when the stream's head lands, out as its tail drops in. */}
        <Animated.View
          style={{ opacity: streamAnim.interpolate({ inputRange: [0, 0.85, 1, 1.5, 2], outputRange: [0, 0, 1, 1, 0] }) }}
        >
          {[0, 0.5].map((offset) => {
            // Two rings half a cycle apart give a continuous ripple.
            const t = Animated.modulo(Animated.add(ripple, offset), 1);
            return (
              <Animated.View
                key={offset}
                style={[
                  styles.ring,
                  {
                    width: glassWidth,
                    height: ringH,
                    top: -ringH / 2,
                    borderRadius: ringH,
                    borderColor: colors[0],
                    opacity: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.95, 0] }),
                    transform: [
                      { scaleX: t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.95] }) },
                      { scaleY: t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                    ],
                  },
                ]}
              />
            );
          })}

          {/* Foam where the stream hits, swelling with the stream's wobble. */}
          <Animated.View
            style={[
              styles.foam,
              {
                left: glassWidth / 2 - streamWidth * 1.4,
                width: streamWidth * 2.8,
                height: Math.max(4, streamWidth * 0.9),
                top: -Math.max(4, streamWidth * 0.9) / 2,
                backgroundColor: colors[0],
                transform: [{ scaleX: wobble.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
              },
            ]}
          />

          {drops.map((d, i) => {
            const a = arcs[i];
            return (
              <Animated.View
                key={i}
                style={[
                  styles.droplet,
                  {
                    left: glassWidth / 2 - a.size / 2,
                    top: -a.size / 2,
                    width: a.size,
                    height: a.size,
                    borderRadius: a.size / 2,
                    backgroundColor: i % 3 === 0 ? colors[0] : colors[1],
                    opacity: d.interpolate({ inputRange: [0, 0.08, 0.7, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [
                      { translateX: d.interpolate({ inputRange: [0, 1], outputRange: [0, a.dx] }) },
                      // A parabolic hop: up and back down onto the surface.
                      {
                        translateY: d.interpolate({
                          inputRange: [0, 0.25, 0.5, 0.75, 1],
                          outputRange: [0, -a.height * 0.75, -a.height, -a.height * 0.75, 0],
                        }),
                      },
                      { scale: d.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] }) },
                    ],
                  },
                ]}
              />
            );
          })}
        </Animated.View>
      </Animated.View>
    </>
  );
}

type SettleProps = { x: number; y: number; glassWidth: number; colors: Grad; onDone: () => void };

/** After the pour stops: the surface settles with a couple of fading ripples and a soft glint. */
export function SettleRipple({ x, y, glassWidth, colors, onDone }: SettleProps) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(
      ({ finished }) => finished && onDone(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ringH = Math.max(5, glassWidth * 0.22);

  return (
    <View pointerEvents="none" style={[styles.layer, styles.splashZone, { left: x - glassWidth / 2, top: y, width: glassWidth }]}>
      {[0, 0.3].map((delay) => {
        const p = t.interpolate({ inputRange: [0, delay, 1], outputRange: [0, 0, 1], extrapolate: 'clamp' });
        return (
          <Animated.View
            key={delay}
            style={[
              styles.ring,
              {
                width: glassWidth,
                height: ringH,
                top: -ringH / 2,
                borderRadius: ringH,
                borderColor: colors[0],
                opacity: p.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.9, 0] }),
                transform: [
                  { scaleX: p.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.95] }) },
                  { scaleY: p.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
                ],
              },
            ]}
          />
        );
      })}
      {/* Glint on the surface that bobs once and fades. */}
      <Animated.View
        style={[
          styles.glint,
          {
            width: glassWidth * 0.8,
            left: glassWidth * 0.1,
            opacity: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.9, 0.7, 0] }),
            transform: [{ translateY: t.interpolate({ inputRange: [0, 0.3, 0.6, 1], outputRange: [0, -2, 1, 0] }) }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', zIndex: 20, elevation: 20 },
  splashZone: { height: 0, overflow: 'visible', zIndex: 21, elevation: 21 },
  streamShine: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.55)' },
  ring: { position: 'absolute', left: 0, borderWidth: 1.5 },
  foam: { position: 'absolute', borderRadius: 999, opacity: 0.9 },
  droplet: { position: 'absolute' },
  glint: { position: 'absolute', top: -1, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.85)' },
});
