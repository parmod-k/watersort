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
  frost: 'rgba(15,5,5,0.58)',
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

/**
 * Liquid colors, left -> right across the bottle for a rounded, glossy look.
 * Every hue is bright and clearly different from the others so players can tell them apart at a glance.
 */
export const liquidGradients: Record<string, [string, string, string]> = {
  cyan: ['#8CF5FF', '#00E5FF', '#00B8D9'],
  red: ['#FF8A8A', '#FF2D2D', '#D10F0F'],
  purple: ['#D9A6FF', '#A33BFF', '#7A12E0'],
  yellow: ['#FFF59E', '#FFE600', '#E6C200'],
  green: ['#7DFF9E', '#00E04B', '#00B33C'],
  pink: ['#FFA6E8', '#FF3EC9', '#E010A6'],
  orange: ['#FFC27A', '#FF8A00', '#E06A00'],
  blue: ['#8FB0FF', '#2B5BFF', '#1A3FD6'],
  lime: ['#E4FF94', '#B8FF1A', '#8FD600'],
  white: ['#FFFFFF', '#F4F6FA', '#CED6E2'],
  brown: ['#D9966B', '#A0522D', '#7A3B1C'],
  black: ['#5A5A6E', '#2B2B38', '#15151D'],
  teal: ['#6FFFE0', '#00C9A0', '#009C7C'],
  lavender: ['#F0E4FF', '#D2B8FF', '#AE8CF0'],
};

/** Order colors are introduced as levels get harder: the most distinct hues come first. */
export const liquidOrder = [
  'cyan', 'red', 'purple', 'yellow', 'green', 'pink', 'orange',
  'blue', 'lime', 'white', 'brown', 'black', 'teal', 'lavender',
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
