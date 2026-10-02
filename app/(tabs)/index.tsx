import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import GameHeader from '../../components/GameHeader';
import GlassPill from '../../components/ui/GlassPill';
import IconButton from '../../components/ui/IconButton';
import GradientButton from '../../components/ui/GradientButton';
import Tube, { TubeColor } from '../../components/game/Tube';
import { colors, fontFamily, liquidGradients, spacing } from '../../theme/tokens';

const CAPACITY = 4;
const TUBE_W = 56;
const TUBE_H = 176;

const initialTubes: TubeColor[][] = [
  ['purple', 'yellow', 'coral', 'cyan'],
  ['coral', 'cyan', 'purple', 'yellow'],
  ['emerald', 'emerald', 'emerald', 'emerald'],
  ['yellow', 'coral', 'purple'],
  ['cyan'],
  [],
];

type Move = { source: number; target: number; color: TubeColor };

function isTubeComplete(stack: TubeColor[]) {
  return stack.length === CAPACITY && stack.every((c) => c === stack[0]);
}

export default function PlayScreen() {
  const [tubes, setTubes] = useState<TubeColor[][]>(initialTubes);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(14);
  const [history, setHistory] = useState<Move[]>([]);
  const [toast, setToast] = useState<{ text: string; icon: keyof typeof MaterialIcons.glyphMap } | null>(null);

  const isAnimating = useRef(false);
  // Resting (untransformed) layouts, used to aim the pour precisely.
  const tubeLayouts = useRef<Array<{ x: number; y: number } | undefined>>([]);
  const rowLayouts = useRef<Array<{ x: number; y: number } | undefined>>([]);
  const anim = useRef(tubes.map(() => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const rotate = useRef(tubes.map(() => new Animated.Value(0))).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shrinkAnim = useRef(new Animated.Value(0)).current;
  const growAnim = useRef(new Animated.Value(0)).current;
  const streamAnim = useRef(new Animated.Value(0)).current;
  const [pourFx, setPourFx] = useState<{ sourceId: number; targetId: number; color: TubeColor } | null>(null);
  const [streamPos, setStreamPos] = useState<{ x: number; y: number; height: number } | null>(null);
  // The tube currently tilting, and which lip it pivots on (1 = right lip, -1 = left lip).
  const [tilt, setTilt] = useState<{ id: number; dir: 1 | -1 } | null>(null);

  const completedCount = useMemo(() => tubes.filter(isTubeComplete).length, [tubes]);

  useEffect(() => {
    const solved = tubes.every((s) => s.length === 0 || isTubeComplete(s));
    const hasLiquid = tubes.some((s) => s.length > 0);
    if (solved && hasLiquid && !isAnimating.current) {
      const t = setTimeout(() => router.push('/level-complete'), 500);
      return () => clearTimeout(t);
    }
  }, [tubes]);

  function showToast(text: string, icon: keyof typeof MaterialIcons.glyphMap = 'info') {
    setToast({ text, icon });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastOpacity.stopAnimation();
    Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
    }, 1600);
  }

  function deselectAll(animated = true) {
    setSelected((prev) => {
      if (prev !== null) {
        if (animated) {
          Animated.timing(anim[prev], {
            toValue: { x: 0, y: 0 },
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();
        } else {
          anim[prev].setValue({ x: 0, y: 0 });
        }
      }
      return null;
    });
  }

  function selectTube(id: number) {
    setSelected(id);
    Animated.timing(anim[id], {
      toValue: { x: 0, y: -24 },
      duration: 220,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
    Haptics.selectionAsync().catch(() => {});
  }

  /** Stage-relative top-left of a tube at rest, or null if not laid out yet. */
  function restPosition(id: number) {
    const tube = tubeLayouts.current[id];
    const row = rowLayouts.current[Math.floor(id / 3)];
    if (!tube || !row) return null;
    return { x: row.x + tube.x, y: row.y + tube.y };
  }

  function executePour(sourceId: number, targetId: number, recordHistory = true) {
    if (isAnimating.current) return;
    const sourceStack = tubes[sourceId];
    const src = restPosition(sourceId);
    const tgt = restPosition(targetId);
    if (!sourceStack || sourceStack.length === 0 || !src || !tgt) {
      deselectAll();
      return;
    }
    isAnimating.current = true;
    const pouredColor = sourceStack[sourceStack.length - 1];

    // Pour toward the target; for a vertically stacked pair, keep the tube body over the board's middle.
    const dir: 1 | -1 = tgt.x > src.x ? 1 : tgt.x < src.x ? -1 : sourceId % 3 === 0 ? -1 : 1;

    // A fuller tube needs less tilt before liquid reaches the mouth; it tips further while pouring.
    const startAngle = Math.min(80, 48 + (CAPACITY - sourceStack.length) * 10);
    const endAngle = Math.min(95, startAngle + 14);

    // The tube pivots on its pouring lip, so the lip is a fixed point: park it just above the
    // centre of the target's mouth, high enough that the tilted wall clears the target's rim.
    const gap = TUBE_W / 2 / Math.tan((startAngle * Math.PI) / 180) + 16;
    const lipRestX = src.x + (dir > 0 ? TUBE_W : 0);
    const lipX = tgt.x + TUBE_W / 2;
    const lipY = tgt.y - gap;

    // The stream runs from the lip down to the target's current liquid surface.
    const surfaceY = tgt.y + 3 + (CAPACITY - tubes[targetId].length) * (TUBE_H / CAPACITY);

    setTilt({ id: sourceId, dir });
    runPourAnimation({
      sourceId,
      targetId,
      pouredColor,
      moveX: lipX - lipRestX,
      moveY: lipY - src.y,
      startAngle: dir * startAngle,
      endAngle: dir * endAngle,
      stream: { x: lipX, y: lipY, height: surfaceY - lipY },
      recordHistory,
    });
  }

  function runPourAnimation({
    sourceId,
    targetId,
    pouredColor,
    moveX,
    moveY,
    startAngle,
    endAngle,
    stream,
    recordHistory,
  }: {
    sourceId: number;
    targetId: number;
    pouredColor: TubeColor;
    moveX: number;
    moveY: number;
    startAngle: number;
    endAngle: number;
    stream: { x: number; y: number; height: number };
    recordHistory: boolean;
  }) {
    // 1. Carry the source over the target's mouth and tip it. The tilt starts a beat later so the
    //    lip pivot (applied via state) is in place before any rotation happens.
    Animated.parallel([
      Animated.timing(anim[sourceId], {
        toValue: { x: moveX, y: moveY },
        duration: 440,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(rotate[sourceId], {
          toValue: startAngle,
          duration: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      shrinkAnim.setValue(0);
      growAnim.setValue(0);
      streamAnim.setValue(0);
      setStreamPos(stream);
      setPourFx({ sourceId, targetId, color: pouredColor });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      // 2. The stream falls from the lip; the source drains and tips further while the target fills.
      Animated.parallel([
        Animated.timing(streamAnim, { toValue: 1, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(rotate[sourceId], {
          toValue: endAngle,
          duration: 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shrinkAnim, { toValue: 1, duration: 480, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(growAnim, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        ]),
      ]).start(() => {
        // 3. The stream's tail drops into the target.
        Animated.timing(streamAnim, { toValue: 2, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
          setTubes((prev) => {
            const next = prev.map((s) => [...s]);
            next[sourceId].pop();
            next[targetId].push(pouredColor);
            return next;
          });
          if (recordHistory) {
            setHistory((h) => [...h, { source: sourceId, target: targetId, color: pouredColor }]);
          }
          setMoves((m) => m + 1);
          showToast(`Poured ${pouredColor}!`, 'opacity');
          setPourFx(null);
          setStreamPos(null);

          // 4. Straighten up and fly back home.
          Animated.parallel([
            Animated.timing(anim[sourceId], {
              toValue: { x: 0, y: 0 },
              duration: 380,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(rotate[sourceId], {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setTilt(null);
            isAnimating.current = false;
            setSelected(null);
          });
        });
      });
    });
  }

  function handleTubePress(id: number) {
    if (isAnimating.current) return;
    const stack = tubes[id];

    if (isTubeComplete(stack)) {
      showToast('Tube completed!', 'star');
      return;
    }

    if (selected === null) {
      if (stack.length > 0) selectTube(id);
      return;
    }
    if (selected === id) {
      deselectAll();
      return;
    }

    const sourceStack = tubes[selected];
    const targetStack = tubes[id];
    const topSource = sourceStack[sourceStack.length - 1];
    const topTarget = targetStack[targetStack.length - 1];
    const valid = targetStack.length < CAPACITY && (targetStack.length === 0 || topTarget === topSource);

    if (valid) {
      executePour(selected, id);
    } else {
      showToast('Invalid Move!', 'block');
      deselectAll();
    }
  }

  function handleDemo() {
    if (isAnimating.current) return;
    for (let s = 0; s < tubes.length; s++) {
      for (let t = 0; t < tubes.length; t++) {
        if (s === t) continue;
        const sourceStack = tubes[s];
        const targetStack = tubes[t];
        if (sourceStack.length === 0 || isTubeComplete(sourceStack)) continue;
        const topSource = sourceStack[sourceStack.length - 1];
        const topTarget = targetStack[targetStack.length - 1];
        const valid = targetStack.length < CAPACITY && (targetStack.length === 0 || topTarget === topSource);
        if (valid) {
          selectTube(s);
          setTimeout(() => executePour(s, t), 260);
          return;
        }
      }
    }
    showToast('No demo moves left!', 'info');
  }

  function handleUndo() {
    if (isAnimating.current) return;
    setHistory((h) => {
      if (h.length === 0) {
        showToast('Nothing to undo', 'undo');
        return h;
      }
      const last = h[h.length - 1];
      setTubes((prev) => {
        const next = prev.map((s) => [...s]);
        next[last.target].pop();
        next[last.source].push(last.color);
        return next;
      });
      setMoves((m) => Math.max(0, m - 1));
      showToast('Previous move undone', 'undo');
      return h.slice(0, -1);
    });
  }

  function handleRestart() {
    if (isAnimating.current) return;
    setTubes(initialTubes.map((s) => [...s]));
    setHistory([]);
    setMoves(14);
    deselectAll(false);
    showToast('Restarting level...', 'refresh');
  }

  function handleAddTube() {
    showToast('Extra tube added!', 'add');
  }

  const rows = [tubes.slice(0, 3), tubes.slice(3, 6)];

  return (
    <View style={styles.screen}>
      <GameHeader />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <GlassPill style={styles.movesPill}>
            <View style={styles.rowCenter}>
              <MaterialIcons name="touch-app" size={18} color={colors.primaryContainer} />
              <Text style={styles.movesLabel}>
                Moves: <Text style={styles.movesValue}>{moves}</Text>
              </Text>
            </View>
          </GlassPill>

          <GlassPill tint="low" style={styles.completedPill} radius={999}>
            <View style={styles.rowCenter}>
              <MaterialIcons name="check-circle" size={14} color={colors.emerald} />
              <Text style={styles.completedText}>{completedCount} OF {tubes.length} COMPLETED</Text>
            </View>
          </GlassPill>

          <Pressable onPress={() => showToast('Hint: try pouring cyan into the empty vial', 'lightbulb')}>
            <GlassPill style={styles.hintPill}>
              <View style={styles.rowCenter}>
                <MaterialIcons name="lightbulb" size={18} color="#FACC15" />
                <Text style={styles.hintText}>Hint</Text>
                <View style={styles.hintBadge}>
                  <Text style={styles.hintBadgeText}>2</Text>
                </View>
              </View>
            </GlassPill>
          </Pressable>
        </View>

        <GlassPill tint="low" style={styles.tipBar} radius={16}>
          <View style={styles.tipRow}>
            <View style={styles.rowCenter}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>Tap a vial to lift, then tap another to pour</Text>
            </View>
            <View style={styles.rowCenter}>
              <MaterialIcons name="vibration" size={18} color={colors.onSurfaceVariant} />
              <MaterialIcons name="volume-up" size={18} color={colors.onSurfaceVariant} style={{ marginLeft: 8 }} />
            </View>
          </View>
        </GlassPill>

        <View style={styles.stage}>
          {rows.map((row, rowIdx) => (
            <View
              key={rowIdx}
              style={[styles.tubeRow, tilt && Math.floor(tilt.id / 3) === rowIdx && styles.raised]}
              onLayout={(e) => {
                const { x, y } = e.nativeEvent.layout;
                rowLayouts.current[rowIdx] = { x, y };
              }}
            >
              {row.map((stack, colIdx) => {
                const id = rowIdx * 3 + colIdx;
                const complete = isTubeComplete(stack);
                const isPourSource = pourFx?.sourceId === id;
                const isPourTarget = pourFx?.targetId === id;
                const isTilting = tilt?.id === id;
                return (
                  <Animated.View
                    key={id}
                    onLayout={(e) => {
                      const { x, y } = e.nativeEvent.layout;
                      tubeLayouts.current[id] = { x, y };
                    }}
                    style={[
                      isTilting && styles.raised,
                      {
                        transform: [
                          { translateX: anim[id].x },
                          { translateY: anim[id].y },
                          {
                            rotate: rotate[id].interpolate({
                              inputRange: [-90, 0, 90],
                              outputRange: ['-90deg', '0deg', '90deg'],
                            }),
                          },
                        ],
                        // Pivot on the pouring lip so it stays fixed over the target's mouth while tipping.
                        transformOrigin: (isTilting ? (tilt.dir > 0 ? '100% 0%' : '0% 0%') : '50% 0%') as any,
                      },
                    ]}
                  >
                    <Pressable onPress={() => handleTubePress(id)} hitSlop={8}>
                      {complete && (
                        <View style={styles.sparkleWrap}>
                          <MaterialIcons name="auto-awesome" size={20} color="#FACC15" />
                        </View>
                      )}
                      <Tube
                        colorsStack={stack}
                        width={TUBE_W}
                        height={TUBE_H}
                        selected={selected === id}
                        complete={complete}
                        shrinkAnim={isPourSource ? shrinkAnim : undefined}
                        growAnim={isPourTarget ? growAnim : undefined}
                        growColor={isPourTarget ? pourFx?.color : undefined}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ))}

          {pourFx && streamPos && (
            <View
              pointerEvents="none"
              style={[styles.streamBeam, { left: streamPos.x - 3, top: streamPos.y, height: streamPos.height }]}
            >
              {/* 0 -> 1: the column falls from the lip; 1 -> 2: its tail drops into the target. */}
              <Animated.View
                style={[
                  styles.streamGradient,
                  {
                    transform: [
                      {
                        translateY: streamAnim.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [-streamPos.height, 0, streamPos.height],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={liquidGradients[pourFx.color] ?? liquidGradients.cyan}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>
          )}
        </View>

        <View style={styles.controlsRow}>
          <IconButton icon="undo" onPress={handleUndo} badge={history.length} badgeColor={colors.surfaceContainerHighest} />
          <GradientButton label="Demo Pour" icon="play-arrow" onPress={handleDemo} />
          <IconButton icon="refresh" onPress={handleRestart} />
          <IconButton icon="add" onPress={handleAddTube} badge="+1" badgeColor={colors.secondary} iconColor={colors.onSurface} />
        </View>
      </View>

      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [
                {
                  translateY: toastOpacity.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
                },
              ],
            },
          ]}
        >
          <MaterialIcons name={toast.icon} size={18} color={colors.primaryContainer} />
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: spacing.margin, paddingTop: spacing.md },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md, flexWrap: 'wrap' },
  movesPill: { paddingHorizontal: 12, paddingVertical: 8 },
  movesLabel: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelMd, fontSize: 13 },
  movesValue: { color: colors.primary, fontFamily: fontFamily.counterNum },
  completedPill: { paddingHorizontal: 12, paddingVertical: 6 },
  completedText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.labelSm, fontSize: 10, letterSpacing: 0.5 },
  hintPill: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 'auto' },
  hintText: { color: colors.onSurface, fontFamily: fontFamily.labelMd, fontSize: 13 },
  hintBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintBadgeText: { color: colors.onSecondaryContainer, fontSize: 10, fontFamily: fontFamily.labelSm },
  tipBar: { paddingHorizontal: 14, paddingVertical: 10, marginBottom: spacing.lg },
  tipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  tipText: { color: colors.onSurfaceVariant, fontFamily: fontFamily.bodySm, fontSize: 12 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 44, position: 'relative' },
  streamBeam: {
    position: 'absolute',
    width: 6,
    borderRadius: 3,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 20,
  },
  streamGradient: { flex: 1, width: '100%' },
  tubeRow: { flexDirection: 'row', gap: 18, justifyContent: 'center' },
  raised: { zIndex: 10, elevation: 16 },
  sparkleWrap: { position: 'absolute', top: -22, left: 0, right: 0, alignItems: 'center', zIndex: 5 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
  },
  toast: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(53,55,80,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  toastText: { color: colors.onSurface, fontFamily: fontFamily.labelMd, fontSize: 13 },
});
