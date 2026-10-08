import { MaterialIcons } from '@expo/vector-icons';
import { colorCountFor, isMysteryLevel } from './levels';

export const LEVELS_PER_CHAPTER = 20;

type ChapterTheme = { name: string; icon: keyof typeof MaterialIcons.glyphMap; tint: string };

const CHAPTERS: ChapterTheme[] = [
  { name: 'First Drops', icon: 'water-drop', tint: '#00B2FE' },
  { name: 'Color Splash', icon: 'palette', tint: '#FF2E93' },
  { name: 'Prismatic Laboratory', icon: 'science', tint: '#A855F7' },
  { name: 'Shade Shifter', icon: 'contrast', tint: '#10B981' },
  { name: 'Mystery Vault', icon: 'help-center', tint: '#F59E0B' },
  { name: 'Liquid Labyrinth', icon: 'extension', tint: '#EF4444' },
];

export function chapterOf(level: number) {
  return Math.ceil(level / LEVELS_PER_CHAPTER);
}

/** Chapters past the named ones cycle through the themes again. */
export function chapterTheme(chapter: number) {
  return CHAPTERS[(chapter - 1) % CHAPTERS.length];
}

export function chapterRange(chapter: number) {
  const first = (chapter - 1) * LEVELS_PER_CHAPTER + 1;
  return { first, last: first + LEVELS_PER_CHAPTER - 1 };
}

/** A short description of what makes a level hard. */
export function levelLabel(level: number) {
  if (isMysteryLevel(level)) return 'Mystery Layers';
  return `${colorCountFor(level)} Colors`;
}

/** The first mystery level at or after `from`. */
export function nextMysteryLevel(from: number) {
  let n = Math.max(1, from);
  while (!isMysteryLevel(n)) n++;
  return n;
}
