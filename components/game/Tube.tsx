import React from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { liquidGradients } from '../../theme/tokens';

export type TubeColor = keyof typeof liquidGradients;

type Props = {
  colorsStack: TubeColor[]; // bottom -> top
  capacity?: number;
  width?: number;
  height?: number;
  selected?: boolean;
  complete?: boolean;
  /** 0 -> 1: animates the current top segment draining away (pour source). */
  shrinkAnim?: Animated.Value;
  /** 0 -> 1: animates a new top segment filling in (pour target). */
  growAnim?: Animated.Value;
  growColor?: TubeColor;
};

export default function Tube({
  colorsStack,
  capacity = 4,
  width = 56,
  height = 176,
  selected = false,
  complete = false,
  shrinkAnim,
  growAnim,
  growColor,
}: Props) {
  const slotHeight = height / capacity;
  const isFull = colorsStack.length === capacity;
  const allSame = isFull && colorsStack.every((c) => c === colorsStack[0]);
  const glowing = complete || allSame;

  return (
    <View
      style={[
        styles.shell,
        {
          width,
          height,
          borderRadius: width / 2,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
        selected && styles.selectedShell,
        glowing && styles.glowShell,
      ]}
    >
      {/* rim */}
      <View style={[styles.rim, { width: width + 8, left: -4 }]} />

      <View
        style={[
          styles.inner,
          {
            borderRadius: width / 2 - 3,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          },
        ]}
      >
        <View style={styles.liquidColumn}>
          {colorsStack.map((color, idx) => {
            const isTop = idx === colorsStack.length - 1;
            const isDraining = isTop && !!shrinkAnim;
            const grad = liquidGradients[color] ?? liquidGradients.cyan;
            const segStyle = isDraining
              ? { height: shrinkAnim!.interpolate({ inputRange: [0, 1], outputRange: [slotHeight, 0] }) }
              : { height: slotHeight };
            return (
              <Animated.View key={idx} style={[styles.segmentWrap, segStyle]}>
                <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill}>
                  {isTop && !isDraining && <View style={styles.meniscus} />}
                  <View style={styles.segmentShade} />
                </LinearGradient>
              </Animated.View>
            );
          })}
          {growAnim && growColor && (
            <Animated.View
              style={[
                styles.segmentWrap,
                { height: growAnim.interpolate({ inputRange: [0, 1], outputRange: [0, slotHeight] }) },
              ]}
            >
              <LinearGradient
                colors={liquidGradients[growColor] ?? liquidGradients.cyan}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              >
                <View style={styles.meniscus} />
                <View style={styles.segmentShade} />
              </LinearGradient>
            </Animated.View>
          )}
        </View>
      </View>

      {/* glass specular highlights */}
      <LinearGradient
        colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
        style={[styles.specularLeft, { height: height - 16 }]}
      />
      <View style={[styles.specularRight, { height: height - 24 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  selectedShell: {
    shadowColor: '#00E5FF',
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  glowShell: {
    shadowColor: '#10E599',
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  rim: {
    position: 'absolute',
    top: -6,
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignSelf: 'center',
  },
  inner: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(10,12,35,0.5)',
    justifyContent: 'flex-end',
  },
  liquidColumn: {
    width: '100%',
    flexDirection: 'column-reverse',
  },
  segmentWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  segmentShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  meniscus: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  specularLeft: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 6,
    borderRadius: 3,
  },
  specularRight: {
    position: 'absolute',
    top: 12,
    right: 8,
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
