---
name: Tiki Splash Casual Puzzle
colors:
  surface: '#fff8f0'
  surface-dim: '#e2d9c9'
  surface-bright: '#fff8f0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf3e2'
  surface-container: '#f6eddc'
  surface-container-high: '#f0e7d7'
  surface-container-highest: '#eae2d1'
  on-surface: '#1f1b11'
  on-surface-variant: '#3c4b38'
  inverse-surface: '#343025'
  inverse-on-surface: '#f9f0df'
  outline: '#6c7b66'
  outline-variant: '#bbcbb3'
  surface-tint: '#006e10'
  primary: '#006e10'
  on-primary: '#ffffff'
  primary-container: '#19e032'
  on-primary-container: '#005d0c'
  inverse-primary: '#24e537'
  secondary: '#7c5800'
  on-secondary: '#ffffff'
  secondary-container: '#feb700'
  on-secondary-container: '#6b4b00'
  tertiary: '#7332e0'
  on-tertiary: '#ffffff'
  tertiary-container: '#ceb6ff'
  on-tertiary-container: '#6318d0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#74ff6c'
  primary-fixed-dim: '#24e537'
  on-primary-fixed: '#002202'
  on-primary-fixed-variant: '#00530a'
  secondary-fixed: '#ffdea8'
  secondary-fixed-dim: '#ffba20'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#eaddff'
  tertiary-fixed-dim: '#d2bbff'
  on-tertiary-fixed: '#25005a'
  on-tertiary-fixed-variant: '#5a00c6'
  background: '#fff8f0'
  on-background: '#1f1b11'
  surface-variant: '#eae2d1'
typography:
  headline-xl:
    fontFamily: Rubik
    fontSize: 40px
    fontWeight: '900'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Rubik
    fontSize: 32px
    fontWeight: '900'
    lineHeight: 38px
  headline-lg:
    fontFamily: Rubik
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 34px
  headline-lg-mobile:
    fontFamily: Rubik
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 30px
  headline-md:
    fontFamily: Rubik
    fontSize: 22px
    fontWeight: '800'
    lineHeight: 28px
  headline-sm:
    fontFamily: Rubik
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Rubik
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Rubik
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Rubik
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-lg:
    fontFamily: Rubik
    fontSize: 18px
    fontWeight: '800'
    lineHeight: 22px
  label-md:
    fontFamily: Rubik
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 18px
  label-sm:
    fontFamily: Rubik
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.5rem
  margin: 1rem
  margin-sm: 0.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 1.75rem
---

## Brand & Style

This design system embodies a vibrant, tactile, and whimsical casual mobile gaming experience inspired by tropical tiki juice bars, sparkling ocean waves, and tactile fluid mechanics. Designed for casual puzzle players who seek instant delight, relaxing visual loops, and tactile feedback, the visual tone is sunny, refreshing, and deeply juicy.

### Design Principles & Aesthetic Direction
- **Tactile / Skeuomorphic Cartoon 3D:** Elements feature rich dimensional qualities—specular highlights, molded double borders, deep drop shadows, and soft ambient bevels that simulate glossy toy plastic, varnished bamboo, and smooth glass juice bottles.
- **Juicy & Bubbly:** UI elements are bulbous and rounded with exaggerated bounce, soft curves, and generous inner gradients that mimic liquid candy or refreshing tropical drinks.
- **Rich Contrast Framing:** High-saturation content is encased in warm golden-yellow, honey, and vivid royal purple chassis, ensuring prominent visibility against bright sunny beach vistas and deep midnight game stages.
- **Joyful Micro-Interactions:** Buttons are squishy and pressurized, depressing visibly on touch with glowing edge-lights, tactile bottom bevels, and crisp pop animations.

## Colors

The palette draws directly from lush tropical islands and crystalline fruit beverages. Rather than flat fills, components use radial and linear gradients that mimic volumetric lighting.

### Functional Palette Structure
- **Primary (Juicy Green / `#19E032`):** Used for primary call-to-action triggers, successful sorting confirmations, play buttons, and add-action tags. Paired with an inner highlight `#66FF66` and deep rim shadow `#0D8F1D`.
- **Secondary (Sunny Gold / `#FFB800`):** Used for premium badges, currency coin containers, card border strokes, level banners, and highlight ribbons. Paired with a warm amber rim `#C46E00` and top specular rim `#FFE665`.
- **Tertiary (Royal Berry Purple / `#6C28D9`):** Provides stabilizing visual contrast for lower docks, tool squircle containers, header pills, and shop backdrops. Tones range from deep berry violet `#3B0B75` to bright lavender `#9855F7`.
- **Neutral (Coconut Cream / `#FFF6E5`):** Soft, warm neutral background tone for text fields, resource counters, and modal content bodies, eliminating sterile digital starkness.
- **Accent Tropical (Lagoon Cyan / `#00B2FE` & Guava Pink / `#FF2E93`):** High-energy accents for secondary badges, water splash fx, sale banners, and stamina hearts.

## Typography

The design system exclusively leverages **Rubik** for all headlines, body, and label roles. Its squircle-adjacent character geometry, heavy font weight options, and rounded counters match the playful physical nature of casual mobile games.

### Stylistic Treatments & Readability Rules
- **Game Title & Level Numbers:** Use `Rubik 900` or `800` set with a heavy drop-shadow, high-contrast dark border stroke (2px–4px `#2A0845` or `#064E1C`), and a subtle vertical color gradient to ensure legible contrast over animated water or background illustrations.
- **Numbers & Counters:** Level digits and currency quantities are always rendered with uppercase numerals and tight letter-spacing for immediate glanceability.
- **Text Layers:** Large headers frequently employ dual-layered presentation: an extruded bottom shadow layer offset by 2px to 4px beneath an inner-bright face layer.

## Layout & Spacing

Layouts adhere to an adaptive mobile-first approach, respecting strict safe zones for standard touch-screen displays (notches, dynamic islands, and home-indicator bars).

### Grid & Composition
- **Vertical Safe-Zone Stacking:** The game UI operates on a fixed anchor layout:
  - **Top Anchor (HUD):** Fixed header housing the mascot profile, lives, soft currency, hard currency, and settings cog.
  - **Stage Area (Flexible Viewport):** Scaled container reserved for the tiki stall, sorter bottles, or shop list modules.
  - **Bottom Action Dock:** Floating CTA anchors (e.g., Level Launch button) or fixed navigation bar tabs spanning full horizontal safe widths.
- **Rhythm & Touch Targets:** Every interactive icon, power-up button, and close trigger maintains a minimum touch boundary of 48×48px, with typical primary buttons spanning a height of 56px–68px.

## Elevation & Depth

Visual depth is achieved through molded 3D skeumorphic construction rather than soft ambient blur shadows.

### Layer Architecture
1. **Under-Rim (Extrusion):** Buttons and cards possess an extruded bottom edge (3px to 6px solid fill) in a deeper version of the surface color (e.g., deep orange beneath gold, dark forest green beneath lime green).
2. **Double Border Bevels:** Prominent cards utilize a dual-stroke technique: an exterior high-contrast gold or violet rim (3px–4px) followed by an inner white or pastel highlight rim (1px–2px).
3. **Gloss Cap Highlight:** Circular power-up buttons and pill banners feature a curved semi-transparent white highlight (`rgba(255, 255, 255, 0.45)`) positioned across the upper half of the element.
4. **Cast Shadows:** Overlaid dialogs and bottom nav bars cast a distinct, directional ground shadow (`0 8px 16px rgba(18, 5, 43, 0.45)`).

## Shapes

The design system embraces a high-radius pill and squircle aesthetic (Roundedness level `3`). Hard corners and razor edges are strictly prohibited to maintain safety, friendliness, and tactile bounce.

### Corner Radius Mapping
- **Resource HUD Pills:** Completely circular endpoints (`border-radius: 9999px`) creating seamless pill containers.
- **Power-Up & Action Squarcles:** Balanced rounded squares (`border-radius: 1.25rem` to `1.5rem`) featuring balanced circular cutouts.
- **Game Cards & Shop Panels:** Chunky outer perimeter corners (`border-radius: 2rem` to `2.5rem`) nesting inner sub-panels (`border-radius: 1.5rem`).
- **Plus Buttons & Badges:** Pure circular disks (`border-radius: 50%`) overlapping container edges.

## Components

### 1. Primary Action Buttons (Play / CTA)
- **Form:** Ultra-thick pill shape (`border-radius: 9999px`) with an outer 4px golden or dark green border, an interior bright glossy gradient (e.g., `#29F143` to `#0EB525`), and a bottom extruded 5px lip (`#087A18`).
- **Typography:** Centered bold text in Rubik 900 with white fill, dark green stroke outline, and a directional drop shadow.
- **States:** Active/Pressed shifts the button content 4px downwards while collapsing the bottom lip.

### 2. HUD Resource Badges
- **Form:** Horizontal capsule/pill with a warm neutral `#FFF6E5` center container and a metallic gold or purple border.
- **Leading Token:** Overhanging left-aligned 3D circular icon (e.g., Heart, Test Tube Coin) bursting out of the pill frame.
- **Trailing Action:** High-gloss bright green circular '+' button affixed to the right edge with a bold white cross.

### 3. Power-Up Squircle Buttons
- **Form:** 60×60px squircle shaped container with purple gloss gradient background, wrapped in an extruded gold double frame.
- **Badge Indicator:** Bottom-right corner green circular mini-badge containing a '+' symbol or yellow quantity counter pill.
- **Content:** Centered high-contrast white vector glyph (Undo Arrow, Shuffle, Add Flask).

### 4. Shop & Reward Cards
- **Shell:** Deep golden honey outer container with double-thick rim.
- **Inner Header / Ribbon:** Inset gradient banner (e.g., magenta-to-pink `#FF2E93` or vivid sky blue `#00B2FE`) containing clear tier descriptions.
- **Content Row:** Cream-colored inset panel showcasing 3D coin piles, bundles, and resource icons, accompanied by a bright green purchase pill button anchored to the lower right.

### 5. Navigation Bar (Dock)
- **Geometry:** Elevated purple base bar with a raised, curved center arch that frames the primary "Home" or "Current Level" hub icon.
- **Tabs:** Tactile icon buttons displaying bright golden stars, chests, or calendars with bold descriptive labels underneath.