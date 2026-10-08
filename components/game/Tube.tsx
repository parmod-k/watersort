import React from 'react';
import { Animated, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily, hiddenGradient, liquidGradients } from '../../theme/tokens';
import { Equipped, fluidPalette, stopperLook, vialLook } from '../../game/cosmetics';
import { useProgress } from '../../game/progress';

export type TubeColor = keyof typeof liquidGradients;

type Props = {
  colorsStack: TubeColor[]; // bottom -> top
  capacity?: number;
  width?: number;
  height?: number;
  selected?: boolean;
  complete?: boolean;
  /** 0 -> 1: animates the top `pourCount` segments draining away, top first (pour source). */
  shrinkAnim?: Animated.Value;
  /** 0 -> 1: animates `pourCount` new top segments filling in (pour target). */
  growAnim?: Animated.Value;
  growColor?: TubeColor;
  /** How many segments the current pour moves. */
  pourCount?: number;
  /** How many bottom segments are "?" mystery layers whose color is not revealed yet. */
  hiddenCount?: number;
  /** Cosmetics to draw instead of the player's equipped ones (Themes tab previews). */
  look?: Partial<Equipped>;
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
  pourCount = 1,
  hiddenCount = 0,
  look,
}: Props) {
  const { equipped } = useProgress();
  const vial = vialLook(look?.vial ?? equipped.vial);
  const stopper = stopperLook(look?.stopper ?? equipped.stopper);
  const palette = fluidPalette(look?.fluid ?? equipped.fluid);
  // Liquid fills the glass inside its border (3) and padding (3) on each end.
  const slotHeight = (height - 12) / capacity;
  const isFull = colorsStack.length === capacity;
  const allSame = isFull && colorsStack.every((c) => c === colorsStack[0]);
  const glowing = complete || allSame;
  // Rounded capsule: soft shoulders at the mouth, a fuller curve at the base.
  const topRadius = Math.min(vial.topCap, width * vial.top);
  const bottomRadius = Math.min(vial.bottomCap, width * vial.bottom);

  return (
    <View
      style={[
        styles.shell,
        {
          width,
          height,
          borderTopLeftRadius: topRadius,
          borderTopRightRadius: topRadius,
          borderBottomLeftRadius: bottomRadius,
          borderBottomRightRadius: bottomRadius,
          borderColor: vial.border,
        },
        selected && styles.selectedShell,
        glowing && !selected && styles.glowShell,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={vial.tint}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: topRadius }]}
      />
      {/* neck lip */}
      <View
        style={[
          styles.lip,
          {
            width: width * 0.6,
            left: width * 0.2 - 3,
            top: -stopper.height,
            height: stopper.height,
            backgroundColor: stopper.fill,
            borderColor: stopper.border,
          },
          selected && styles.lipSelected,
        ]}
      />

      <View
        style={[
          styles.inner,
          {
            borderTopLeftRadius: topRadius - 4,
            borderTopRightRadius: topRadius - 4,
            borderBottomLeftRadius: bottomRadius - 4,
            borderBottomRightRadius: bottomRadius - 4,
          },
        ]}
      >
        <View style={styles.liquidColumn}>
          {colorsStack.map((color, idx) => {
            const isTop = idx === colorsStack.length - 1;
            // Depth from the top; draining segments empty one after another, top first.
            const depth = colorsStack.length - 1 - idx;
            const isDraining = !!shrinkAnim && depth < pourCount;
            const isHidden = idx < hiddenCount;
            const grad = isHidden ? hiddenGradient : palette[color] ?? palette.cyan;
            const segStyle = isDraining
              ? {
                  height: shrinkAnim!.interpolate({
                    inputRange: [depth / pourCount, (depth + 1) / pourCount],
                    outputRange: [slotHeight, 0],
                    extrapolate: 'clamp',
                  }),
                }
              : { height: slotHeight };
            return (
              <Animated.View key={idx} style={[styles.segmentWrap, segStyle]}>
                <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill}>
                  {isTop && !isDraining && <View style={styles.meniscus} />}
                  <View style={styles.segmentShade} />
                  {isHidden && (
                    <View style={styles.hiddenMark}>
                      <Text style={[styles.hiddenText, { fontSize: Math.max(10, slotHeight * 0.45) }]}>?</Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            );
          })}
          {growAnim && growColor && (
            <Animated.View
              style={[
                styles.segmentWrap,
                { height: growAnim.interpolate({ inputRange: [0, 1], outputRange: [0, slotHeight * pourCount] }) },
              ]}
            >
              <LinearGradient
                colors={palette[growColor] ?? palette.cyan}
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

      {/* front gloss reflection stripe */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
        locations={[0, 0.8, 1]}
        style={[styles.specularLeft, { height: height * 0.86, width: Math.max(4, width * 0.11) }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    padding: 3,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.78)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  selectedShell: {
    borderColor: '#FEF08A',
    shadowColor: '#FDE047',
    shadowOpacity: 0.95,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  glowShell: {
    borderColor: '#BBF7D0',
    shadowColor: '#10E599',
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  lip: {
    position: 'absolute',
    top: -9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: 'rgba(220,235,255,0.95)',
    zIndex: 10,
  },
  lipSelected: { backgroundColor: '#FEF9C3', borderColor: '#FDE047' },
  inner: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  hiddenMark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  hiddenText: {
    color: '#FFFFFF',
    fontFamily: fontFamily.black,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  meniscus: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  specularLeft: {
    position: 'absolute',
    top: 6,
    left: 4,
    borderRadius: 4,
    zIndex: 8,
  },
});
