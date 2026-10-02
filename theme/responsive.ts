import { useWindowDimensions } from 'react-native';

/** Width breakpoints, in dp. */
export const breakpoints = {
  /** Narrow phones such as the iPhone SE (1st gen) and small Androids. */
  compact: 360,
  /** Small tablets, foldables opened, and wide browser windows. */
  tablet: 600,
  /** Large tablets and desktop browsers. */
  wide: 900,
};

/** Widest the main column grows to; past this, content stays centred instead of stretching. */
export const contentMaxWidth = {
  /** Lists, cards and other reading content. */
  page: 640,
  /** The game board, which benefits from extra room for bottles. */
  board: 820,
};

/** Screen-size info for adapting layouts to phones, tablets, landscape and web. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isCompact = width < breakpoints.compact;
  const isTablet = width >= breakpoints.tablet;
  const isWide = width >= breakpoints.wide;
  // Short screens (small phones, landscape) get tighter vertical spacing.
  const isShort = height < 700;
  // Side margin grows a little on larger screens.
  const gutter = isCompact ? 12 : isTablet ? 24 : 16;
  return { width, height, isCompact, isTablet, isWide, isShort, isLandscape: width > height, gutter };
}
