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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useIsFocused } from 'expo-router';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import Pill from '../../components/ui/Pill';
import IconButton from '../../components/ui/IconButton';
import Tube, { TubeColor } from '../../components/game/Tube';
import { colors, fontFamily, liquidGradients, spacing } from '../../theme/tokens';
import {
  CAPACITY,
  canPour,
  generateLevel,
  isSolved,
  isTubeComplete,
  pourCount,
  solve,
} from '../../game/levels';
import { recordFor, scoreFor, targetSeconds } from '../../game/scoring';
import { completeLevel, useProgress } from '../../game/progress';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';

/** Upper bound on bottles on the board (largest level plus the extra-bottle power-up). */
const MAX_TUBES = 20;
const HINTS_PER_LEVEL = 3;
/** Inner padding of the frosted board frame (the top leaves room for bottle lips and sparkles). */
const BOARD_PAD = { x: 14, top: 24, bottom: 16 };
/** Distance from a bottle's outer edge to its liquid (glass border plus inner padding). */
const GLASS_INSET = 6;

type ToastTone = 'info' | 'alert';

type Move = { source: number; target: number; color: TubeColor; count: number };

/**
 * Fits the bottles into the stage: up to 3 rows, shrinking bottles as the count grows.
 * `scale` (1 on phones) lets bottles and gaps grow on larger screens.
 */
function boardLayout(count: number, stageW: number, stageH: number, scale = 1) {
  // A wide, short stage (landscape, desktop) fits more bottles per row.
  const wideStage = stageW > stageH * 1.4;
  const rows = wideStage ? (count <= 8 ? 1 : count <= 16 ? 2 : 3) : count <= 5 ? 1 : count <= 10 ? 2 : 3;
  const perRow = Math.ceil(count / rows);
  const gapX = (perRow >= 6 ? 10 : 18) * scale;
  const rowGap = (rows === 3 ? 34 : 44) * Math.min(scale, 1.2);
  // Room above the top row for the lifted bottle and the completion sparkle.
  const headroom = 30;
  let tubeW = Math.min(56 * scale, (stageW - (perRow - 1) * gapX) / perRow);
  const tubeH = Math.min(tubeW * 3.15, (stageH - headroom - (rows - 1) * rowGap) / rows);
  tubeW = Math.min(tubeW, tubeH / 2.6);
  return { rows, perRow, gapX, rowGap, tubeW, tubeH };
}

export default function PlayScreen() {
  const progress = useProgress();
  const levelNum = progress.current;
  const level = useMemo(() => generateLevel(levelNum), [levelNum]);

  const [tubes, setTubes] = useState<TubeColor[][]>(() => level.tubes.map((t) => [...t]));
  const [hidden, setHidden] = useState<number[]>(() => [...level.hidden]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<Move[]>([]);
  const [undoUsed, setUndoUsed] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_LEVEL);
  const [extraTubeUsed, setExtraTubeUsed] = useState(false);
  // Seconds spent on this board; only counts while the Play tab is visible and unsolved.
  const [seconds, setSeconds] = useState(0);
  const [stageSize, setStageSize] = useState<{ w: number; h: number } | null>(null);
  const [toast, setToast] = useState<{ text: string; icon: keyof typeof MaterialIcons.glyphMap; tone: ToastTone } | null>(
    null,
  );

  const isAnimating = useRef(false);
  const solvedRef = useRef(false);
  const isFocused = useIsFocused();
  // Resting (untransformed) layouts, used to aim the pour precisely.
  const tubeLayouts = useRef<Array<{ x: number; y: number } | undefined>>([]);
  const rowLayouts = useRef<Array<{ x: number; y: number } | undefined>>([]);
  const boardOffset = useRef<{ x: number; y: number } | null>(null);
  const anim = useRef(Array.from({ length: MAX_TUBES }, () => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const rotate = useRef(Array.from({ length: MAX_TUBES }, () => new Animated.Value(0))).current;
  const toastPop = useRef(new Animated.Value(1)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shrinkAnim = useRef(new Animated.Value(0)).current;
  const growAnim = useRef(new Animated.Value(0)).current;
  const streamAnim = useRef(new Animated.Value(0)).current;
  const [pourFx, setPourFx] = useState<{ sourceId: number; targetId: number; color: TubeColor; count: number } | null>(null);
  const [streamPos, setStreamPos] = useState<{ x: number; y: number; height: number } | null>(null);
  // The tube currently tilting, and which lip it pivots on (1 = right lip, -1 = left lip).
  const [tilt, setTilt] = useState<{ id: number; dir: 1 | -1 } | null>(null);

  const { width, isCompact, isTablet, isWide, isShort, gutter } = useResponsive();
  // The header only has room for a Moves pill on wider screens; otherwise it moves to the info panel.
  const movesInHeader = width >= 430;
  const boardScale = isWide ? 1.5 : isTablet ? 1.3 : 1;
  const layout = stageSize
    ? boardLayout(
        tubes.length,
        stageSize.w - BOARD_PAD.x * 2,
        stageSize.h - BOARD_PAD.top - BOARD_PAD.bottom,
        boardScale,
      )
    : null;
  const controlSize = isCompact ? 46 : isTablet ? 64 : 56;
  const heroSize = isCompact ? 62 : isTablet ? 84 : 76;
  const completedCount = useMemo(() => tubes.filter(isTubeComplete).length, [tubes]);

  function resetBoard() {
    anim.forEach((a) => a.setValue({ x: 0, y: 0 }));
    rotate.forEach((r) => r.setValue(0));
    setTubes(level.tubes.map((t) => [...t]));
    setHidden([...level.hidden]);
    setSelected(null);
    setMoves(0);
    setHistory([]);
    setUndoUsed(false);
    setHintsLeft(HINTS_PER_LEVEL);
    setExtraTubeUsed(false);
    setSeconds(0);
    setPourFx(null);
    setStreamPos(null);
    setTilt(null);
    solvedRef.current = false;
  }

  // Load a fresh board whenever a level is started (next level, replay, or picked on the Stages tab).
  const loadedSession = useRef(progress.session);
  useEffect(() => {
    if (loadedSession.current === progress.session) return;
    loadedSession.current = progress.session;
    resetBoard();
    if (level.mystery) showToast('Mystery level: pour to reveal hidden layers', 'help-outline');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.session]);

  const solved = isSolved(tubes) && tubes.some((s) => s.length > 0);
  useEffect(() => {
    if (!isFocused || solved) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isFocused, solved]);

  useEffect(() => {
    if (solvedRef.current || !solved) return;
    solvedRef.current = true;
    const result = { moves, par: level.par, seconds, usedUndo: undoUsed, usedExtraBottle: extraTubeUsed };
    const t = setTimeout(() => {
      const record = recordFor(result);
      const coins = 100 + record.stars * 50;
      completeLevel(levelNum, result, coins);
      const score = scoreFor(result);
      router.push({
        pathname: '/level-complete',
        params: {
          level: levelNum,
          moves,
          par: level.par,
          seconds,
          stars: record.stars,
          coins,
          undo: undoUsed ? 1 : 0,
          extra: extraTubeUsed ? 1 : 0,
          colors: level.colorCount,
          score: score.total,
          efficiency: score.efficiency,
          time: score.time,
          restraint: score.restraint,
        },
      });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tubes]);

  /** Flashes a message in the tip banner; it falls back to the level tip after a moment. */
  function showToast(text: string, icon: keyof typeof MaterialIcons.glyphMap = 'info', tone: ToastTone = 'info') {
    setToast({ text, icon, tone });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastPop.stopAnimation();
    toastPop.setValue(0.9);
    Animated.spring(toastPop, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => setToast(null), 1800);
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
    if (!layout) return null;
    const tube = tubeLayouts.current[id];
    const row = rowLayouts.current[Math.floor(id / layout.perRow)];
    const board = boardOffset.current;
    if (!tube || !row || !board) return null;
    return { x: board.x + row.x + tube.x, y: board.y + row.y + tube.y };
  }

  function executePour(sourceId: number, targetId: number, recordHistory = true) {
    if (isAnimating.current || !layout) return;
    const sourceStack = tubes[sourceId];
    const src = restPosition(sourceId);
    const tgt = restPosition(targetId);
    if (!sourceStack || sourceStack.length === 0 || !src || !tgt) {
      deselectAll();
      return;
    }
    isAnimating.current = true;
    const { tubeW, tubeH, perRow } = layout;
    const pouredColor = sourceStack[sourceStack.length - 1];
    // Pour the whole run of matching top segments, limited by the target's free slots.
    const count = pourCount(sourceStack, tubes[targetId]);

    // Pour toward the target; for a vertically stacked pair, keep the tube body over the board's middle.
    const dir: 1 | -1 = tgt.x > src.x ? 1 : tgt.x < src.x ? -1 : sourceId % perRow < perRow / 2 ? -1 : 1;

    // A fuller tube needs less tilt before liquid reaches the mouth; it tips further while pouring.
    const startAngle = Math.min(80, 48 + (CAPACITY - sourceStack.length) * 10);
    const endAngle = Math.min(95, startAngle + 4 + count * 10);

    // The tube pivots on its pouring lip, so the lip is a fixed point: park it just above the
    // centre of the target's mouth, high enough that the tilted wall clears the target's rim.
    const gap = tubeW / 2 / Math.tan((startAngle * Math.PI) / 180) + 16;
    const lipRestX = src.x + (dir > 0 ? tubeW : 0);
    const lipX = tgt.x + tubeW / 2;
    const lipY = tgt.y - gap;

    // The stream runs from the lip down to the target's current liquid surface.
    const surfaceY = tgt.y + GLASS_INSET + (CAPACITY - tubes[targetId].length) * ((tubeH - GLASS_INSET * 2) / CAPACITY);

    setTilt({ id: sourceId, dir });
    runPourAnimation({
      sourceId,
      targetId,
      pouredColor,
      count,
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
    count,
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
    count: number;
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
      setPourFx({ sourceId, targetId, color: pouredColor, count });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

      // 2. The stream falls from the lip; the source drains and tips further while the target fills.
      //    More segments take proportionally longer to pour.
      const pourMs = 260 + count * 220;
      Animated.parallel([
        Animated.timing(streamAnim, { toValue: 1, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(rotate[sourceId], {
          toValue: endAngle,
          duration: pourMs + 40,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shrinkAnim, { toValue: 1, duration: pourMs, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(growAnim, { toValue: 1, duration: pourMs - 60, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        ]),
      ]).start(() => {
        // 3. The stream's tail drops into the target.
        Animated.timing(streamAnim, { toValue: 2, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
          const remaining = tubes[sourceId].length - count;
          setTubes((prev) => {
            const next = prev.map((s) => [...s]);
            next[sourceId].splice(-count, count);
            for (let i = 0; i < count; i++) next[targetId].push(pouredColor);
            return next;
          });
          // A mystery layer that becomes the top of its bottle is revealed for good.
          const reveals = remaining > 0 && hidden[sourceId] >= remaining;
          if (reveals) {
            setHidden((prev) => prev.map((h, i) => (i === sourceId ? remaining - 1 : h)));
          }
          if (recordHistory) {
            setHistory((h) => [...h, { source: sourceId, target: targetId, color: pouredColor, count }]);
          }
          setMoves((m) => m + 1);
          if (reveals) showToast('Mystery layer revealed!', 'visibility');
          else showToast(count > 1 ? `Poured ${count}× ${pouredColor}!` : `Poured ${pouredColor}!`, 'opacity');
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

    if (canPour(tubes[selected], tubes[id])) {
      executePour(selected, id);
    } else {
      showToast('Invalid Move!', 'block', 'alert');
      deselectAll();
    }
  }

  /** Next move from the solver, falling back to any legal move. */
  function suggestMove() {
    const plan = solve(tubes, 20000);
    if (plan && plan.length > 0) return plan[0];
    for (let s = 0; s < tubes.length; s++) {
      if (isTubeComplete(tubes[s])) continue;
      for (let t = 0; t < tubes.length; t++) {
        if (s !== t && canPour(tubes[s], tubes[t])) return { source: s, target: t };
      }
    }
    return null;
  }

  function handleDemo() {
    if (isAnimating.current) return;
    const move = suggestMove();
    if (!move) {
      showToast('No moves left — try undo', 'info');
      return;
    }
    deselectAll(false);
    selectTube(move.source);
    setTimeout(() => executePour(move.source, move.target), 260);
  }

  function handleHint() {
    if (isAnimating.current) return;
    if (hintsLeft === 0) {
      showToast('No hints left this level', 'lightbulb');
      return;
    }
    const move = suggestMove();
    if (!move) {
      showToast('No moves left — try undo', 'lightbulb');
      return;
    }
    setHintsLeft((h) => h - 1);
    deselectAll(false);
    selectTube(move.source);
    showToast(`Hint: pour into bottle ${move.target + 1}`, 'lightbulb');
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
        next[last.target].splice(-last.count, last.count);
        for (let i = 0; i < last.count; i++) next[last.source].push(last.color);
        return next;
      });
      setMoves((m) => Math.max(0, m - 1));
      setUndoUsed(true);
      showToast('Previous move undone', 'undo');
      return h.slice(0, -1);
    });
  }

  function handleRestart() {
    if (isAnimating.current) return;
    resetBoard();
    showToast('Restarting level...', 'refresh');
  }

  function handleAddTube() {
    if (isAnimating.current) return;
    if (extraTubeUsed) {
      showToast('Extra bottle already used', 'add');
      return;
    }
    setExtraTubeUsed(true);
    setTubes((prev) => [...prev, []]);
    setHidden((prev) => [...prev, 0]);
    showToast('Extra bottle added!', 'add');
  }

  const rows: number[][] = [];
  if (layout) {
    for (let r = 0; r < layout.rows; r++) {
      const ids = [];
      for (let id = r * layout.perRow; id < Math.min(tubes.length, (r + 1) * layout.perRow); id++) ids.push(id);
      rows.push(ids);
    }
  }

  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const overTime = seconds > targetSeconds(level.par);
  const tip = level.mystery
    ? 'Mystery level: pour off the top to reveal ? layers'
    : moves === 0
      ? 'Tap a flask to pick, then tap another to pour!'
      : `Par ${level.par} moves · ${level.colorCount} colors · ${level.emptyCount} empty`;
  const movesPill = (
    <Pill variant="amber" style={styles.movesPill}>
      <Text style={styles.movesLabel}>MOVES</Text>
      <Text style={styles.movesValue}>{moves}</Text>
    </Pill>
  );

  return (
    <View style={styles.screen}>
      <GameHeader level={levelNum} coins={progress.coins} accessory={movesInHeader ? movesPill : undefined} />
      <View style={[styles.content, { paddingHorizontal: gutter }]}>
        <Panel style={[styles.infoPanel, isShort && { marginTop: 4 }]} radius={20}>
          {!movesInHeader && (
            <>
              <InfoChip icon="touch-app" tint="#F59E0B" label="Moves" value={String(moves)} />
              <View style={styles.infoDivider} />
            </>
          )}
          <InfoChip icon="timer" tint={overTime ? '#EF4444' : '#FB7185'} label="Time" value={clock} warn={overTime} />
          <View style={styles.infoDivider} />
          <InfoChip icon="check-circle" tint="#10B981" label="Sorted" value={`${completedCount}/${level.colorCount}`} />
          {movesInHeader && (
            <>
              <View style={styles.infoDivider} />
              {level.mystery ? (
                <InfoChip icon="help" tint="#A855F7" label="Mystery" value="Reveal ?" />
              ) : (
                <InfoChip icon="flag" tint="#00B2FE" label="Par" value={`${level.par} moves`} />
              )}
            </>
          )}
        </Panel>

        <View
          style={styles.stage}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setStageSize({ w: width, h: height });
          }}
        >
          {layout && (
            <View
              style={[styles.board, { gap: layout.rowGap }]}
              onLayout={(e) => {
                const { x, y } = e.nativeEvent.layout;
                boardOffset.current = { x, y };
              }}
            >
              {/* Frosted glass tray behind the bottles; a sibling so lifted bottles are never clipped. */}
              <View pointerEvents="none" style={styles.boardFrost}>
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
              </View>
              {rows.map((ids, rowIdx) => (
                <View
                  key={rowIdx}
                  style={[
                    styles.tubeRow,
                    { gap: layout.gapX },
                    tilt && Math.floor(tilt.id / layout.perRow) === rowIdx && styles.raised,
                  ]}
                  onLayout={(e) => {
                    const { x, y } = e.nativeEvent.layout;
                    rowLayouts.current[rowIdx] = { x, y };
                  }}
                >
                  {ids.map((id) => {
                    const stack = tubes[id];
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
                        <Pressable onPress={() => handleTubePress(id)} hitSlop={6}>
                          {complete && (
                            <View style={styles.sparkleWrap}>
                              <MaterialIcons name="auto-awesome" size={layout.tubeW < 44 ? 16 : 20} color="#FDE047" />
                            </View>
                          )}
                          <Tube
                            colorsStack={stack}
                            width={layout.tubeW}
                            height={layout.tubeH}
                            selected={selected === id}
                            complete={complete}
                            hiddenCount={hidden[id] ?? 0}
                            shrinkAnim={isPourSource ? shrinkAnim : undefined}
                            growAnim={isPourTarget ? growAnim : undefined}
                            growColor={isPourTarget ? pourFx?.color : undefined}
                            pourCount={pourFx?.count}
                          />
                        </Pressable>
                      </Animated.View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

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

        {/* Tip banner; flashes move feedback, then returns to the level tip. */}
        <Animated.View style={[styles.bannerWrap, { transform: [{ scale: toastPop }] }]}>
          {toast?.tone === 'alert' ? (
            <View style={[styles.banner, styles.bannerAlert]}>
              <MaterialIcons name={toast.icon} size={16} color="#FFE4E6" />
              <Text style={[styles.bannerText, { color: '#FFE4E6' }]} numberOfLines={2}>
                {toast.text}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#FBBF24', '#FDE047', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.banner}
            >
              <MaterialIcons
                name={toast?.icon ?? (level.mystery ? 'help-outline' : 'beach-access')}
                size={16}
                color={colors.goldInk}
              />
              <Text style={styles.bannerText} numberOfLines={2}>
                {toast?.text ?? tip}
              </Text>
            </LinearGradient>
          )}
        </Animated.View>

        <View style={[styles.dock, isShort && { paddingTop: 8, paddingBottom: 6 }]}>
          <IconButton icon="undo" label="Undo" onPress={handleUndo} badge={history.length || undefined} size={controlSize} />
          <IconButton icon="refresh" label="Restart" onPress={handleRestart} size={controlSize} />
          <IconButton icon="play-arrow" label={isCompact ? 'Demo' : 'Demo Pour'} variant="gold" onPress={handleDemo} size={heroSize} />
          <IconButton
            icon="lightbulb"
            label="Hint"
            onPress={handleHint}
            badge={hintsLeft}
            badgeTone="gold"
            size={controlSize}
            disabled={hintsLeft === 0}
          />
          <IconButton
            icon="science"
            label={isCompact ? 'Bottle' : '+ Bottle'}
            onPress={handleAddTube}
            badge={extraTubeUsed ? undefined : '+1'}
            badgeTone="gold"
            size={controlSize}
            disabled={extraTubeUsed}
          />
        </View>
      </View>
    </View>
  );
}

/** One stat in the cream info panel: a tinted icon tile with a label and value. */
function InfoChip({
  icon,
  tint,
  label,
  value,
  warn = false,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  tint: string;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipIcon, { backgroundColor: tint }]}>
        <MaterialIcons name={icon} size={16} color="#FFFFFF" />
      </View>
      <View style={{ flexShrink: 1 }}>
        <Text style={styles.chipLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.chipValue, warn && { color: '#DC2626' }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, width: '100%', maxWidth: contentMaxWidth.board, alignSelf: 'center' },

  movesPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 36 },
  movesLabel: { color: colors.goldInk, fontFamily: fontFamily.black, fontSize: 11, letterSpacing: 0.3 },
  movesValue: {
    color: '#FFFFFF',
    fontFamily: fontFamily.black,
    fontSize: 15,
    textShadowColor: '#92400E',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 0.5,
  },

  infoPanel: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoDivider: { width: 2, height: 28, borderRadius: 1, backgroundColor: 'rgba(245,158,11,0.3)', marginHorizontal: 6 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  chipIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chipLabel: { color: colors.inkMuted, fontFamily: fontFamily.bold, fontSize: 10, lineHeight: 12 },
  chipValue: { color: colors.ink, fontFamily: fontFamily.black, fontSize: 14, lineHeight: 17 },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: spacing.sm },
  board: {
    paddingHorizontal: BOARD_PAD.x,
    paddingTop: BOARD_PAD.top,
    paddingBottom: BOARD_PAD.bottom,
    alignItems: 'center',
  },
  boardFrost: {
    ...StyleSheet.absoluteFill,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.frost,
    borderWidth: 2,
    borderColor: colors.frostEdge,
  },
  streamBeam: {
    position: 'absolute',
    width: 6,
    borderRadius: 3,
    overflow: 'hidden',
    zIndex: 20,
    elevation: 20,
  },
  streamGradient: { flex: 1, width: '100%' },
  tubeRow: { flexDirection: 'row', justifyContent: 'center' },
  raised: { zIndex: 10, elevation: 16 },
  sparkleWrap: { position: 'absolute', top: -26, left: 0, right: 0, alignItems: 'center', zIndex: 5 },

  bannerWrap: { marginTop: spacing.sm, alignSelf: 'stretch' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bannerAlert: { backgroundColor: 'rgba(136,19,55,0.92)', borderColor: '#FDA4AF' },
  bannerText: { color: colors.goldInk, fontFamily: fontFamily.black, fontSize: 13, flexShrink: 1, textAlign: 'center' },

  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
