export const colors = {
  surface: '#0F1128',
  surfaceDim: '#0F1128',
  surfaceBright: '#353750',
  surfaceContainerLowest: '#0A0C23',
  surfaceContainerLow: '#181A31',
  surfaceContainer: '#1C1E35',
  surfaceContainerHigh: '#262840',
  surfaceContainerHighest: '#31334B',
  onSurface: '#E0E0FF',
  onSurfaceVariant: '#BAC9CC',
  outline: '#849396',
  outlineVariant: '#3B494C',

  primary: '#C3F5FF',
  onPrimary: '#00363D',
  primaryContainer: '#00E5FF',
  onPrimaryContainer: '#00626E',
  primaryFixed: '#9CF0FF',
  primaryFixedDim: '#00DAF3',
  onPrimaryFixed: '#001F24',

  secondary: '#E8B3FF',
  onSecondary: '#510074',
  secondaryContainer: '#9D06DD',
  onSecondaryContainer: '#F5D6FF',

  tertiary: '#FFE7E2',
  onTertiary: '#630F00',
  tertiaryContainer: '#FFC2B4',
  onTertiaryContainer: '#A62C10',
  tertiaryFixed: '#FFDAD2',

  error: '#FFB4AB',
  onError: '#690005',

  // Liquid spectrum
  cyan: '#00E5FF',
  violet: '#C042FF',
  sunset: '#FF6B4A',
  emerald: '#10E599',
  amber: '#FFD13B',
  rose: '#FF3385',

  textHigh: '#FFFFFF',
  textSoftGlow: '#A5B4FC',
};

export const liquidGradients: Record<string, [string, string, string]> = {
  cyan: ['#67E8F9', '#00E5FF', '#0891B2'],
  coral: ['#FF8A70', '#FF6B4A', '#C43212'],
  emerald: ['#34D399', '#10E599', '#059669'],
  purple: ['#D946EF', '#A855F7', '#7E22CE'],
  yellow: ['#FDE047', '#FACC15', '#CA8A04'],
};

export const fontFamily = {
  displayLg: 'Quicksand_700Bold',
  headlineLg: 'Quicksand_700Bold',
  headlineMd: 'Quicksand_600SemiBold',
  headlineSm: 'Quicksand_600SemiBold',
  labelLg: 'Quicksand_700Bold',
  labelMd: 'Quicksand_700Bold',
  labelSm: 'Quicksand_700Bold',
  counterNum: 'Quicksand_700Bold',
  bodyLg: 'NunitoSans_600SemiBold',
  bodyMd: 'NunitoSans_500Medium',
  bodySm: 'NunitoSans_500Medium',
};

export const typography = {
  displayLg: { fontFamily: fontFamily.displayLg, fontSize: 32, lineHeight: 40, letterSpacing: -0.4 },
  headlineLg: { fontFamily: fontFamily.headlineLg, fontSize: 28, lineHeight: 36, letterSpacing: -0.2 },
  headlineMd: { fontFamily: fontFamily.headlineMd, fontSize: 22, lineHeight: 30 },
  headlineSm: { fontFamily: fontFamily.headlineSm, fontSize: 18, lineHeight: 24 },
  bodyLg: { fontFamily: fontFamily.bodyLg, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: fontFamily.bodyMd, fontSize: 14, lineHeight: 20 },
  bodySm: { fontFamily: fontFamily.bodySm, fontSize: 12, lineHeight: 16 },
  labelLg: { fontFamily: fontFamily.labelLg, fontSize: 15, lineHeight: 20, letterSpacing: 0.3 },
  labelMd: { fontFamily: fontFamily.labelMd, fontSize: 13, lineHeight: 18, letterSpacing: 0.4 },
  labelSm: { fontFamily: fontFamily.labelSm, fontSize: 11, lineHeight: 14, letterSpacing: 0.5 },
  counterNum: { fontFamily: fontFamily.counterNum, fontSize: 20, lineHeight: 24, letterSpacing: -0.2 },
};

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  gutterSm: 8,
  gutter: 16,
  margin: 16,
};
