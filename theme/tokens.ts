/**
 * "Tiki Splash" theme: a sunny tropical juice bar. Bright cartoon-3D chassis (royal purple and
 * sunny gold frames with extruded bottom rims) over an illustrated beach backdrop, with warm
 * coconut-cream panels for reading content. See UI/theme/DESIGN.md.
 */
export const colors = {
  // Cream panels and the text that sits on them.
  cream: '#FFF6E5',
  creamDeep: '#F6EDDC',
  creamEdge: '#EAE2D1',
  ink: '#1F1B11',
  inkSoft: '#5B4A33',
  inkMuted: '#8A7A62',

  // Text placed straight on the backdrop or on purple chassis.
  onArt: '#FFFFFF',
  onArtGold: '#FDE68A',

  // Juicy green: primary actions and success.
  green: '#19E032',
  greenLight: '#66FF66',
  greenDeep: '#0EB525',
  greenRim: '#087A18',
  greenInk: '#005D0C',

  // Sunny gold: currency, frames, banners.
  gold: '#FFB800',
  goldLight: '#FFE665',
  goldPale: '#FDE047',
  goldDeep: '#F59E0B',
  goldRim: '#B45309',
  goldInk: '#451A03',

  // Royal berry purple: tool buttons, header plaques, the dock.
  purple: '#6C28D9',
  purpleLight: '#9855F7',
  purpleDeep: '#3B0B75',
  purpleRim: '#2E0A5C',
  purpleInk: '#3B0764',

  // Tropical accents.
  lagoon: '#00B2FE',
  guava: '#FF2E93',
  coral: '#EF4444',
  amber: '#F59E0B',

  // Board frame and bottle glass.
  frost: 'rgba(255,255,255,0.22)',
  frostEdge: 'rgba(255,255,255,0.65)',
  glassEdge: 'rgba(255,255,255,0.78)',
  selectGlow: '#FDE047',

  // Fallback behind the backdrop image (warm tavern wood).
  backdrop: '#2B170C',
  scrim: 'rgba(18,5,43,0.55)',
};

/** Three-stop vertical gradients for the cartoon-3D chassis: [top highlight, body, bottom]. */
export const chassis = {
  purple: ['#A855F7', '#7C3AED', '#4C1D95'] as [string, string, string],
  gold: ['#FDE047', '#FBBF24', '#F59E0B'] as [string, string, string],
  green: ['#4ADE80', '#22C55E', '#15A32F'] as [string, string, string],
  amber: ['#FBBF24', '#F59E0B', '#D97706'] as [string, string, string],
  cream: ['#FFFFFF', '#FFF6E5', '#FCEBCB'] as [string, string, string],
  dock: ['#7C3AED', '#5B21B6', '#3B0B75'] as [string, string, string],
};

/** Liquid colors, left -> right across the bottle for a rounded, glossy look. */
export const liquidGradients: Record<string, [string, string, string]> = {
  cyan: ['#7DE3FF', '#00B2FE', '#0284C7'],
  coral: ['#FF8A80', '#EF4444', '#B91C1C'],
  emerald: ['#5EF0B4', '#10B981', '#047857'],
  purple: ['#D8A8FF', '#A855F7', '#7E22CE'],
  yellow: ['#FFF07A', '#FACC15', '#CA8A04'],
  pink: ['#FFA3D1', '#EC4899', '#BE185D'],
  orange: ['#FFC078', '#F59E0B', '#C2410C'],
  blue: ['#93C5FD', '#3B82F6', '#1D4ED8'],
  lime: ['#E2FF8A', '#A3E635', '#4D7C0F'],
  red: ['#FCA5A5', '#DC2626', '#7F1D1D'],
  // Later levels add look-alike shades to make sorting harder.
  sky: ['#E0F2FE', '#7DD3FC', '#0284C7'],
  navy: ['#818CF8', '#4338CA', '#1E1B4B'],
  teal: ['#5EEAD4', '#14B8A6', '#0F766E'],
  brown: ['#E0B084', '#A16207', '#5C3A0A'],
};

/** Order colors are introduced as levels get harder: distinct hues first, look-alikes last. */
export const liquidOrder = [
  'cyan', 'coral', 'purple', 'yellow', 'emerald', 'pink', 'orange',
  'blue', 'lime', 'red', 'sky', 'navy', 'teal', 'brown',
] as const;

/** Greyed-out look for a "mystery" layer whose color is not yet revealed. */
export const hiddenGradient: [string, string, string] = ['#9CA3AF', '#6B7280', '#4B5563'];

/** Rubik throughout, as the design system specifies; weights map to roles. */
export const fontFamily = {
  black: 'Rubik_900Black',
  extraBold: 'Rubik_800ExtraBold',
  bold: 'Rubik_700Bold',
  semiBold: 'Rubik_600SemiBold',
  medium: 'Rubik_500Medium',
};

export const typography = {
  headlineXl: { fontFamily: fontFamily.black, fontSize: 40, lineHeight: 48 },
  headlineXlMobile: { fontFamily: fontFamily.black, fontSize: 32, lineHeight: 38 },
  headlineLg: { fontFamily: fontFamily.extraBold, fontSize: 28, lineHeight: 34 },
  headlineMd: { fontFamily: fontFamily.extraBold, fontSize: 22, lineHeight: 28 },
  headlineSm: { fontFamily: fontFamily.bold, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: fontFamily.semiBold, fontSize: 16, lineHeight: 22 },
  bodyMd: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: fontFamily.medium, fontSize: 12, lineHeight: 16 },
  labelLg: { fontFamily: fontFamily.extraBold, fontSize: 18, lineHeight: 22 },
  labelMd: { fontFamily: fontFamily.bold, fontSize: 14, lineHeight: 18 },
  labelSm: { fontFamily: fontFamily.bold, fontSize: 11, lineHeight: 14 },
};

/** Drop shadow that keeps white text legible over the illustrated backdrop. */
export const artTextShadow = {
  textShadowColor: 'rgba(0,0,0,0.75)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 4,
};

/** Extruded "under-rim" text, used for big titles: a dark outline-ish shadow below a bright face. */
export const titleTextShadow = (color: string) => ({
  textShadowColor: color,
  textShadowOffset: { width: 0, height: 3 },
  textShadowRadius: 0.5,
});

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  squircle: 20,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  '2xl': 36,
  gutterSm: 8,
  gutter: 16,
  margin: 16,
};
