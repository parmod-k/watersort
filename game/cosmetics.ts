import { liquidGradients } from '../theme/tokens';

/**
 * Cosmetic catalog for the Themes tab. Every item belongs to one slot; the equipped item in each
 * slot changes how bottles are drawn on every screen.
 */
export type CosmeticSlot = 'vial' | 'fluid' | 'stopper';

/** How an item is obtained. Level and star items unlock on their own once the goal is reached. */
export type Unlock =
  | { kind: 'free' }
  | { kind: 'coins'; price: number }
  | { kind: 'level'; level: number }
  | { kind: 'stars'; stars: number };

/** Bottle glass: corner rounding (fraction of the bottle width, capped in px), rim and tint. */
export type VialLook = {
  top: number;
  topCap: number;
  bottom: number;
  bottomCap: number;
  border: string;
  tint: [string, string, string];
};

/** Fluid style: recolors the base palette's [highlight, body, shade] gradient. */
export type FluidLook = { recolor: (g: [string, string, string]) => [string, string, string] };

/** The cap sitting on the bottle's mouth. */
export type StopperLook = { fill: string; border: string; height: number };

type ItemBase = {
  id: string;
  name: string;
  sub: string;
  tag: string;
  tagColor: string;
  unlock: Unlock;
};

export type CosmeticItem =
  | (ItemBase & { slot: 'vial'; look: VialLook })
  | (ItemBase & { slot: 'fluid'; look: FluidLook })
  | (ItemBase & { slot: 'stopper'; look: StopperLook });

export type Equipped = Record<CosmeticSlot, string>;

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function mix(hex: string, toward: string, amount: number) {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(toward.slice(1), 16);
  const ch = (shift: number) => {
    const x = (a >> shift) & 255;
    const y = (b >> shift) & 255;
    return Math.round(x + (y - x) * amount);
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1).toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

const GLASS_TINT: [string, string, string] = ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.06)', 'rgba(200,230,255,0.2)'];

export const COSMETICS: CosmeticItem[] = [
  // Vial shapes
  {
    id: 'vial.standard', slot: 'vial', name: 'Standard Cylinder', sub: 'Default Classic', tag: 'Classic', tagColor: '#10B981',
    unlock: { kind: 'free' },
    look: { top: 0.37, topCap: 20, bottom: 0.42, bottomCap: 24, border: 'rgba(255,255,255,0.78)', tint: GLASS_TINT },
  },
  {
    id: 'vial.flask', slot: 'vial', name: 'Alchemist Flask', sub: 'Erlenmeyer Core', tag: 'Rare', tagColor: '#00B2FE',
    unlock: { kind: 'coins', price: 300 },
    look: { top: 0.18, topCap: 10, bottom: 0.5, bottomCap: 40, border: 'rgba(224,242,254,0.9)', tint: GLASS_TINT },
  },
  {
    id: 'vial.potion', slot: 'vial', name: 'Potion Bottle', sub: 'Curved Witching Phial', tag: 'Level 10', tagColor: '#F59E0B',
    unlock: { kind: 'level', level: 10 },
    look: {
      top: 0.3, topCap: 16, bottom: 0.5, bottomCap: 40, border: 'rgba(254,215,170,0.9)',
      tint: ['rgba(255,237,213,0.35)', 'rgba(255,255,255,0.06)', 'rgba(251,191,36,0.18)'],
    },
  },
  {
    id: 'vial.galaxy', slot: 'vial', name: 'Galaxy Shards', sub: 'Starfield Glass', tag: 'Epic', tagColor: '#A855F7',
    unlock: { kind: 'coins', price: 800 },
    look: {
      top: 0.22, topCap: 12, bottom: 0.3, bottomCap: 16, border: 'rgba(196,181,253,0.95)',
      tint: ['rgba(167,139,250,0.4)', 'rgba(76,29,149,0.15)', 'rgba(236,72,153,0.25)'],
    },
  },
  {
    id: 'vial.cryo', slot: 'vial', name: 'Cryo Tube', sub: 'Reinforced Chamber', tag: 'Tech', tagColor: '#0EA5E9',
    unlock: { kind: 'coins', price: 1200 },
    look: {
      top: 0.1, topCap: 6, bottom: 0.14, bottomCap: 8, border: 'rgba(186,230,253,0.95)',
      tint: ['rgba(186,230,253,0.4)', 'rgba(255,255,255,0.05)', 'rgba(56,189,248,0.25)'],
    },
  },
  {
    id: 'vial.prism', slot: 'vial', name: 'Prism Crystal', sub: 'Faceted Star Glow', tag: 'Legendary', tagColor: '#FF2E93',
    unlock: { kind: 'stars', stars: 150 },
    look: {
      top: 0.04, topCap: 3, bottom: 0.26, bottomCap: 14, border: 'rgba(251,207,232,0.95)',
      tint: ['rgba(253,224,71,0.3)', 'rgba(255,255,255,0.05)', 'rgba(244,114,182,0.3)'],
    },
  },

  // Fluid styles
  {
    id: 'fluid.classic', slot: 'fluid', name: 'Classic Juice', sub: 'Bright and glossy', tag: 'Classic', tagColor: '#10B981',
    unlock: { kind: 'free' },
    look: { recolor: (g) => g },
  },
  {
    id: 'fluid.pastel', slot: 'fluid', name: 'Pastel Smoothie', sub: 'Soft creamy shades', tag: 'Rare', tagColor: '#00B2FE',
    unlock: { kind: 'coins', price: 400 },
    look: { recolor: (g) => [mix(g[0], '#FFFFFF', 0.45), mix(g[1], '#FFFFFF', 0.35), mix(g[2], '#FFFFFF', 0.25)] },
  },
  {
    id: 'fluid.jewel', slot: 'fluid', name: 'Jewel Tonic', sub: 'Deep gemstone tones', tag: 'Level 20', tagColor: '#F59E0B',
    unlock: { kind: 'level', level: 20 },
    look: { recolor: (g) => [mix(g[1], '#FFFFFF', 0.15), mix(g[1], '#000000', 0.2), mix(g[2], '#000000', 0.4)] },
  },
  {
    id: 'fluid.matte', slot: 'fluid', name: 'Matte Syrup', sub: 'Flat, no shine', tag: 'Epic', tagColor: '#A855F7',
    unlock: { kind: 'coins', price: 900 },
    look: { recolor: (g) => [g[1], g[1], mix(g[1], '#000000', 0.12)] },
  },

  // Stoppers
  {
    id: 'stopper.glass', slot: 'stopper', name: 'Glass Rim', sub: 'Open bottle mouth', tag: 'Classic', tagColor: '#10B981',
    unlock: { kind: 'free' },
    look: { fill: 'rgba(255,255,255,0.9)', border: 'rgba(220,235,255,0.95)', height: 9 },
  },
  {
    id: 'stopper.cork', slot: 'stopper', name: 'Cork Stopper', sub: 'Rustic tavern seal', tag: 'Rare', tagColor: '#00B2FE',
    unlock: { kind: 'coins', price: 200 },
    look: { fill: '#C68B59', border: '#8B5A2B', height: 11 },
  },
  {
    id: 'stopper.gold', slot: 'stopper', name: 'Golden Cap', sub: 'Polished treasure lid', tag: '30 Stars', tagColor: '#F59E0B',
    unlock: { kind: 'stars', stars: 30 },
    look: { fill: '#FDE047', border: '#B45309', height: 10 },
  },
  {
    id: 'stopper.ruby', slot: 'stopper', name: 'Ruby Seal', sub: 'Wax-dipped royal cap', tag: 'Epic', tagColor: '#A855F7',
    unlock: { kind: 'coins', price: 700 },
    look: { fill: '#FB7185', border: '#9F1239', height: 11 },
  },
];

export const DEFAULT_EQUIPPED: Equipped = { vial: 'vial.standard', fluid: 'fluid.classic', stopper: 'stopper.glass' };

const BY_ID = new Map(COSMETICS.map((c) => [c.id, c]));

export function cosmetic(id: string) {
  return BY_ID.get(id);
}

export function itemsFor(slot: CosmeticSlot) {
  return COSMETICS.filter((c) => c.slot === slot);
}

/** Whether the player may equip an item: free, bought, or its level/star goal reached. */
export function isOwned(item: CosmeticItem, owned: string[], unlocked: number, stars: number) {
  switch (item.unlock.kind) {
    case 'free':
      return true;
    case 'coins':
      return owned.includes(item.id);
    case 'level':
      return unlocked >= item.unlock.level;
    case 'stars':
      return stars >= item.unlock.stars;
  }
}

function lookFor<S extends CosmeticSlot>(slot: S, id: string | undefined) {
  const item = (id && cosmetic(id)) || cosmetic(DEFAULT_EQUIPPED[slot])!;
  return (item.slot === slot ? item : cosmetic(DEFAULT_EQUIPPED[slot])!).look as Extract<CosmeticItem, { slot: S }>['look'];
}

export const vialLook = (id?: string) => lookFor('vial', id);
export const stopperLook = (id?: string) => lookFor('stopper', id);

const fluidCache = new Map<string, Record<string, [string, string, string]>>();

/** The full liquid palette as recolored by a fluid style. */
export function fluidPalette(id?: string): Record<string, [string, string, string]> {
  const key = id ?? DEFAULT_EQUIPPED.fluid;
  let palette = fluidCache.get(key);
  if (!palette) {
    const { recolor } = lookFor('fluid', key);
    palette = Object.fromEntries(Object.entries(liquidGradients).map(([name, g]) => [name, recolor(g)]));
    fluidCache.set(key, palette);
  }
  return palette;
}
