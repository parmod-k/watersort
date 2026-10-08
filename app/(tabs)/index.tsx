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
import { haptic, ImpactFeedbackStyle, NotificationFeedbackType } from '../../game/haptics';
import { router, useIsFocused } from 'expo-router';
import GameHeader from '../../components/GameHeader';
import Panel from '../../components/ui/Panel';
import Pill from '../../components/ui/Pill';
import IconButton from '../../components/ui/IconButton';
import Tube, { TubeColor } from '../../components/game/Tube';
import { PourStream, SettleRipple } from '../../components/game/PourEffects';
import { colors, fontFamily, spacing } from '../../theme/tokens';
import { fluidPalette } from '../../game/cosmetics';
import {
  CAPACITY,
  canPour,
  generateLevel,
  isSolved,
  isTubeComplete,
  pourCount,
  solve,
} from '../../game/levels';
import { scoreFor, targetSeconds } from '../../game/scoring';
import { completeLevel, grantAdCoins, payForBooster, useProgress } from '../../game/progress';
import { showRewarded, useRewardedReady } from '../../game/ads';
import { Booster, BOOSTERS, boosterPrice, ECONOMY } from '../../game/economy';
import { playSfx, rampSfx, stopSfx } from '../../game/sfx';
import { contentMaxWidth, useResponsive } from '../../theme/responsive';

/** Upper bound on bottles on the board (largest level plus the extra-bottle power-up). */
const MAX_TUBES = 20;
/** Inner padding of the frosted board frame (the top leaves room for bottle lips and sparkles). */
const BOARD_PAD = { x: 14, top: 24, bottom: 16 };
/** Distance from a bottle's outer edge to its liquid (glass border plus inner padding). */
const GLASS_INSET = 6;

type Move = { source: number; target: number; color: TubeColor; count: number };

const NO_BOOSTERS_USED: Record<Booster, number> = { undo: 0, hint: 0, restart: 0, extraBottle: 0 };

/** Where the pour stream runs, in stage coordinates. */
type StreamPos = { x: number; y: number; height: number; rise: number; glassWidth: number; streamWidth: number };

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
  const palette = fluidPalette(progress.equipped.fluid);

  const [tubes, setTubes] = useState<TubeColor[][]>(() => level.tubes.map((t) => [...t]));
  const [hidden, setHidden] = useState<number[]>(() => [...level.hidden]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [history, setHistory] = useState<Move[]>([]);
  const [undoUsed, setUndoUsed] = useState(false);
  /** Booster uses on this level. Survives Restart so restarting can't refill the free allowance. */
  const [boostersUsed, setBoostersUsed] = useState(NO_BOOSTERS_USED);
  /** Short message above the dock, e.g. when a booster can't be afforded (then offers a rewarded ad). */
  const [notice, setNotice] = useState<{ text: string; offerAd: boolean } | null>(null);
  const adReady = useRewardedReady();
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [extraTubeUsed, setExtraTubeUsed] = useState(false);
  // Seconds spent on this board; only counts while the Play tab is visible and unsolved.
  const [seconds, setSeconds] = useState(0);
  const [stageSize, setStageSize] = useState<{ w: number; h: number } | null>(null);

  const isAnimating = useRef(false);
  const pourSoundTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const solvedRef = useRef(false);
  const isFocused = useIsFocused();
  // Resting (untransformed) layouts, used to aim the pour precisely.
  const tubeLayouts = useRef<Array<{ x: number; y: number } | undefined>>([]);
  const rowLayouts = useRef<Array<{ x: number; y: number } | undefined>>([]);
  const boardOffset = useRef<{ x: number; y: number } | null>(null);
  const anim = useRef(Array.from({ length: MAX_TUBES }, () => new Animated.ValueXY({ x: 0, y: 0 }))).current;
  const rotate = useRef(Array.from({ length: MAX_TUBES }, () => new Animated.Value(0))).current;

  const shrinkAnim = useRef(new Animated.Value(0)).current;
  const growAnim = useRef(new Animated.Value(0)).current;
  const streamAnim = useRef(new Animated.Value(0)).current;
  const [pourFx, setPourFx] = useState<{ sourceId: number; targetId: number; color: TubeColor; count: number } | null>(null);
  const [streamPos, setStreamPos] = useState<StreamPos | null>(null);
  // Ripple on the target's surface once the pour stops; `key` restarts it for back-to-back pours.
  const [settleFx, setSettleFx] = useState<{ x: number; y: number; width: number; color: TubeColor; key: number } | null>(
    null,
  );
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
    setExtraTubeUsed(false);
    setSeconds(0);
    setPourFx(null);
    setStreamPos(null);
    setSettleFx(null);
    clearTimeout(pourSoundTimer.current);
    stopSfx('pour');
    setTilt(null);
    solvedRef.current = false;
  }

  // Load a fresh board whenever a level is started (next level, replay, or picked on the Stages tab).
  const loadedSession = useRef(progress.session);
  useEffect(() => {
    if (loadedSession.current === progress.session) return;
    loadedSession.current = progress.session;
    resetBoard();
    setBoostersUsed(NO_BOOSTERS_USED);
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
      const { record, coins, trialBonus } = completeLevel(levelNum, result);
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
          trial: trialBonus,
        },
      });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tubes]);

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
    haptic.selection();
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

    // The stream runs from the lip down to the target's current liquid surface, which rises as it fills.
    const slotH = (tubeH - GLASS_INSET * 2) / CAPACITY;
    const surfaceY = tgt.y + GLASS_INSET + (CAPACITY - tubes[targetId].length) * slotH;

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
      stream: {
        x: lipX,
        y: lipY,
        height: surfaceY - lipY,
        rise: count * slotH,
        glassWidth: tubeW - GLASS_INSET * 2,
        streamWidth: Math.max(4, Math.min(9, tubeW * 0.13)),
      },
      recordHistory,
    });
  }

  /**
   * The pour sound follows the liquid: silent while the stream falls from the lip, a soft trickle
   * as it lands, a steady flow, then thinning out as the source empties. Like a real bottle, the
   * note rises as the target fills and its air column gets shorter.
   */
  function playPourSound(filledBefore: number, count: number, pourMs: number) {
    const pitch = (fill: number) => 0.88 + (fill / CAPACITY) * 0.26;
    const LAND_MS = 120; // matches the stream's fall before the target starts filling
    const ATTACK_MS = 90;
    const flowMs = pourMs - LAND_MS;
    const taperMs = Math.min(220, flowMs * 0.3);
    clearTimeout(pourSoundTimer.current);
    pourSoundTimer.current = setTimeout(() => {
      playSfx('pour', { volume: 0.2, rate: pitch(filledBefore) });
      rampSfx('pour', { volume: 0.75, rate: pitch(filledBefore + count * (ATTACK_MS / flowMs)) }, ATTACK_MS, () =>
        rampSfx('pour', { rate: pitch(filledBefore + count * (1 - taperMs / flowMs)) }, flowMs - ATTACK_MS - taperMs, () =>
          rampSfx('pour', { volume: 0.45, rate: pitch(filledBefore + count) }, taperMs),
        ),
      );
    }, LAND_MS);
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
    stream: StreamPos;
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
      setSettleFx(null);
      haptic.impact(ImpactFeedbackStyle.Light);

      // 2. The stream falls from the lip; the source drains and tips further while the target fills.
      //    More segments take proportionally longer to pour.
      const pourMs = 300 + count * 240;
      playPourSound(tubes[targetId].length, count, pourMs);
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
        // 3. The stream's tail drops into the target and the surface settles; the pour sound fades
        //    out over the same 140ms so it dies away just as the last of the liquid lands.
        stopSfx('pour', 140);
        Animated.timing(streamAnim, { toValue: 2, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
          const remaining = tubes[sourceId].length - count;
          const fillsBottle = isTubeComplete([...tubes[targetId], ...Array(count).fill(pouredColor)]);
          if (fillsBottle) {
            playSfx('chime', { volume: 0.8 });
            haptic.notify(NotificationFeedbackType.Success);
          } else {
            playSfx('plop', { volume: 0.6, rate: 0.95 + Math.random() * 0.15 });
          }
          setSettleFx({
            x: stream.x,
            y: stream.y + stream.height - stream.rise,
            width: stream.glassWidth,
            color: pouredColor,
            key: Date.now(),
          });
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

    if (isTubeComplete(stack)) return;

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

  function showNotice(text: string, offerAd = false) {
    clearTimeout(noticeTimer.current);
    setNotice({ text, offerAd });
    noticeTimer.current = setTimeout(() => setNotice(null), offerAd ? 4000 : 2000);
  }

  async function watchAdForCoins() {
    clearTimeout(noticeTimer.current);
    setNotice(null);
    if (await showRewarded()) grantAdCoins(ECONOMY.adReward);
  }

  /** Charges for one booster use (free within the level's allowance). False if it can't be afforded. */
  function chargeBooster(kind: Booster) {
    if (!payForBooster(kind, boostersUsed[kind])) {
      haptic.notify(NotificationFeedbackType.Error);
      showNotice(`Need ${boosterPrice(kind, boostersUsed[kind])} coins`, adReady);
      return false;
    }
    setBoostersUsed((u) => ({ ...u, [kind]: u[kind] + 1 }));
    return true;
  }

  /** Corner badge: free uses left (green), else the coin price (gold). */
  function boosterBadge(kind: Booster) {
    const price = boosterPrice(kind, boostersUsed[kind]);
    return price === 0
      ? { badge: BOOSTERS[kind].free - boostersUsed[kind], badgeTone: 'green' as const }
      : { badge: price, badgeTone: 'gold' as const };
  }

  function handleHint() {
    if (isAnimating.current) return;
    const move = suggestMove();
    if (!move) return;
    if (!chargeBooster('hint')) return;
    deselectAll(false);
    selectTube(move.source);
  }

  function handleUndo() {
    if (isAnimating.current || history.length === 0) return;
    if (!chargeBooster('undo')) return;
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setTubes((prev) => {
        const next = prev.map((s) => [...s]);
        next[last.target].splice(-last.count, last.count);
        for (let i = 0; i < last.count; i++) next[last.source].push(last.color);
        return next;
      });
      setMoves((m) => Math.max(0, m - 1));
      setUndoUsed(true);
      return h.slice(0, -1);
    });
  }

  function handleRestart() {
    if (isAnimating.current || moves === 0) return;
    if (!chargeBooster('restart')) return;
    resetBoard();
  }

  function handleAddTube() {
    if (isAnimating.current) return;
    if (extraTubeUsed) return;
    if (!chargeBooster('extraBottle')) return;
    setExtraTubeUsed(true);
    setTubes((prev) => [...prev, []]);
    setHidden((prev) => [...prev, 0]);
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
            // Ignore the 0x0 layout reported while this tab is hidden.
            if (width > 0 && height > 0) setStageSize({ w: width, h: height });
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
            <PourStream
              x={streamPos.x}
              lipY={streamPos.y}
              surfaceY={streamPos.y + streamPos.height}
              rise={streamPos.rise}
              glassWidth={streamPos.glassWidth}
              streamWidth={streamPos.streamWidth}
              colors={palette[pourFx.color] ?? palette.cyan}
              streamAnim={streamAnim}
              growAnim={growAnim}
            />
          )}
          {settleFx && (
            <SettleRipple
              key={settleFx.key}
              x={settleFx.x}
              y={settleFx.y}
              glassWidth={settleFx.width}
              colors={palette[settleFx.color] ?? palette.cyan}
              onDone={() => setSettleFx(null)}
            />
          )}
          {notice && (
            <Pressable
              style={styles.noticeWrap}
              disabled={!notice.offerAd || !adReady}
              onPress={watchAdForCoins}
              accessibilityRole={notice.offerAd ? 'button' : undefined}
            >
              <Pill variant="amber" style={styles.notice}>
                <MaterialIcons
                  name={notice.offerAd && adReady ? 'play-circle-filled' : 'monetization-on'}
                  size={16}
                  color={colors.goldInk}
                />
                <Text style={[styles.movesLabel, styles.noticeText]} numberOfLines={1}>
                  {notice.offerAd && adReady ? `${notice.text} · Watch ad +${ECONOMY.adReward}` : notice.text}
                </Text>
              </Pill>
            </Pressable>
          )}
        </View>

        <View style={[styles.dock, isShort && { paddingTop: 8, paddingBottom: 6 }]}>
          <IconButton
            icon="undo"
            label="Undo"
            onPress={handleUndo}
            {...boosterBadge('undo')}
            size={controlSize}
            disabled={history.length === 0}
          />
          <IconButton
            icon="refresh"
            label="Restart"
            onPress={handleRestart}
            {...boosterBadge('restart')}
            size={controlSize}
            disabled={moves === 0}
          />
          <IconButton icon="lightbulb" label="Hint" onPress={handleHint} {...boosterBadge('hint')} size={controlSize} />
          <IconButton
            icon="science"
            label={isCompact ? 'Bottle' : '+ Bottle'}
            onPress={handleAddTube}
            {...(extraTubeUsed ? {} : boosterBadge('extraBottle'))}
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

  noticeWrap: { position: 'absolute', bottom: 8, alignSelf: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
  },
  noticeText: { fontSize: 13, flexShrink: 0 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: spacing.sm },
  board: {
    // Span the stage's full width; the rows stay centered inside it.
    alignSelf: 'stretch',
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
  tubeRow: { flexDirection: 'row', justifyContent: 'center' },
  raised: { zIndex: 10, elevation: 16 },
  sparkleWrap: { position: 'absolute', top: -26, left: 0, right: 0, alignItems: 'center', zIndex: 5 },

  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
