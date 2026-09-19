---
name: Liquid Lumina
colors:
  surface: '#0f1128'
  surface-dim: '#0f1128'
  surface-bright: '#353750'
  surface-container-lowest: '#0a0c23'
  surface-container-low: '#181a31'
  surface-container: '#1c1e35'
  surface-container-high: '#262840'
  surface-container-highest: '#31334b'
  on-surface: '#e0e0ff'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e0e0ff'
  inverse-on-surface: '#2d2e47'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#e8b3ff'
  on-secondary: '#510074'
  secondary-container: '#9d06dd'
  on-secondary-container: '#f5d6ff'
  tertiary: '#ffe7e2'
  on-tertiary: '#630f00'
  tertiary-container: '#ffc2b4'
  on-tertiary-container: '#a62c10'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#f6d9ff'
  secondary-fixed-dim: '#e8b3ff'
  on-secondary-fixed: '#310048'
  on-secondary-fixed-variant: '#7200a3'
  tertiary-fixed: '#ffdad2'
  tertiary-fixed-dim: '#ffb4a3'
  on-tertiary-fixed: '#3d0600'
  on-tertiary-fixed-variant: '#8c1900'
  background: '#0f1128'
  on-background: '#e0e0ff'
  surface-variant: '#31334b'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Quicksand
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-lg:
    fontFamily: Quicksand
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Quicksand
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Quicksand
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  counter-num:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
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
  margin-tablet: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style
This design system crafts a sensory-rich, relaxing, yet electrifying hyper-casual puzzle experience. It combines a deep, meditative cosmic atmosphere with tactile, high-gloss micro-interactions.

### Brand Personality & Emotional Resonance
- **Tactile & Responsive:** Every vial, fluid droplet, and HUD badge feels like a physical piece of illuminated cast acrylic or polished quartz glass. Interacting with the interface should feel delightfully bouncy and fluid.
- **Soothing Flow:** The backdrop sets an ambient, pressure-free focus zone that melts away external fatigue, allowing glowing fluids to command full visual attention.
- **Rewarding Brilliance:** High-chroma chromatic pops evoke dopamine hits through candy-like clarity without inducing eye fatigue against the deep field.

### Design Movement
**Tactile Luminous Glassmorphism.** The aesthetic relies on thick, refractive glass physics, inner specular caustic highlights, deep violet-indigo gradients, and squishy volumetric pills with subtle inset ambient bevels.

## Colors
The color architecture divides into three structural layers: a dark ambient spatial stage, pristine ultra-gloss containers, and hyper-saturated liquid pigments.

### Canvas & Surfaces
- **Stage Midnight (Canvas Deep):** `#0F1123` to `#1A1D36` vertical directional gradient (180deg).
- **Acrylic Glass Tint:** `rgba(255, 255, 255, 0.07)` background fill with an upper rim specular sheen of `rgba(255, 255, 255, 0.35)`.
- **Panel Underlay:** `#12142B` with 70% opacity and 24px background blur.

### Liquid Spectrum (Game Fluid Tokens)
- **Cyan Surge (Primary):** `#00E5FF`
- **Candy Violet (Secondary):** `#C042FF`
- **Sunset Flare (Tertiary):** `#FF6B4A`
- **Emerald Pulse:** `#10E599`
- **Solar Amber:** `#FFD13B`
- **Neon Rose:** `#FF3385`

### Functional Text & Rim Strokes
- **Text High-Contrast:** `#FFFFFF`
- **Text Soft-Glow:** `#A5B4FC`
- **Vial Refraction Rim:** `rgba(255, 255, 255, 0.22)`
- **Vial Base Glow:** `rgba(0, 229, 255, 0.15)`

## Typography
Typography is rounded, tactile, and playful without sacrificing clarity or compact mobile spacing. 

- **Quicksand** serves as the display, headline, badge, and counter voice. Its organic circular terminals echo the curvature of vials, bubbles, and meniscus liquid lines.
- **Nunito Sans** carries descriptive micro-copy, reward dialog details, and settings labels, ensuring legibility at small sizes while preserving a warm, rounded aesthetic.
- Numbers on HUD pills and power-up counters use `counter-num` with tabular figures where available to avoid jittering during rapid coin increments.

## Layout & Spacing
The layout uses an adaptive vertical viewport design tailored primarily for single-hand mobile gaming (9:16 to 9:20 aspect ratios), scaling into an anchored center column on tablets.

### Grid & Layout Structure
- **Game Stage Grid:** A dynamic 2-row liquid tube matrix. Tubes auto-calculate distribution using `gutter-sm` (8px) for compact 10-12 vial puzzles and `gutter` (16px) for standard 6-8 vial layouts.
- **Safe Zones:** Pinned HUD header height at `56px` beneath safe-area top; pinned bottom utility tray at `72px` above navigation pill or safe-area bottom.
- **Screen Margins:** Fixed `16px` on mobile, expanding to `32px` on tablet views with a centered container constrained to a maximum width of `560px`.

## Elevation & Depth
Depth is produced through realistic optical physics: light refraction, glossy specular highlights, and colored back-glows rather than flat drop shadows.

### Elevation Levels
- **Level 0 (Stage Void):** Background radial gradient `#1A1D36` centered vertically at 40%, transitioning down to deep `#0F1123`.
- **Level 1 (Empty Glass Tubes):** Inner refractive border (`inset 0 1px 1px 0 rgba(255,255,255,0.4)`), outer soft glow (`0 8px 24px -4px rgba(0,0,0,0.45)`).
- **Level 2 (Liquid Filling & HUD Badges):** 
  - Fluid layers cast a tinted glow matching their base token (e.g. `0 4px 16px rgba(0, 229, 255, 0.4)` for Cyan).
  - Floating badges utilize a translucent acrylic backplane with an intense dual-edge highlight: top-left highlight of `rgba(255, 255, 255, 0.35)` and bottom shadow of `rgba(0, 0, 0, 0.5)`.
- **Level 3 (Lifted / Selected Vial):** When tapped, a tube elevates by `-18px` along the Y-axis and gains an aura: `0 14px 32px rgba(0, 229, 255, 0.35), 0 0 12px rgba(255, 255, 255, 0.4)`.
- **Level 4 (Modals & Celebration Sheets):** Centered modal overlays resting on a `rgba(7, 8, 18, 0.8)` backdrop blur (16px).

## Shapes
A roundedness value of `3` governs this system, producing signature soft, bubbly pill silhouettes.

### Corner Radii Guidelines
- **HUD Badges & Buttons:** Fully curved pill capsules (`border-radius: 9999px`).
- **Glass Tubes:** Flat open rim at the top with softly rounded lip corners (6px) and a deeply curved semicircular test-tube bottom (`border-radius: 0 0 28px 28px`).
- **Liquid Segments:** Horizontal rects with bottom-most segments matching the tube's 28px curvature; the top segment renders a soft concave/convex fluid meniscus curve (radius 4px).
- **Dialog Cards:** Expansive roundedness at `32px` to emphasize toy-like tactile softness.

## Components

### Vials & Glass Tubes
- **Structure:** Cylindrical body (typical mobile width: `44px - 52px`, height: `160px - 190px`).
- **Glass Shell:** Double-layer gradient outline; subtle vertical specular line running down the left flank (width: `2px`, white at 25% opacity).
- **Fluid Units:** 4 distinct color segments per tube separated by a razor-thin fluid seam (`rgba(255, 255, 255, 0.15)`).
- **Liquid Meniscus:** Animated SVG curve atop the highest fluid layer with an undulating ripple during transfer.

### Tactile Bubbly Buttons
- **Primary Action (Play, Claim):** Vibrant saturated fill with an inner top gloss crescent (`inset 0 2px 1px rgba(255,255,255,0.6)`), an extruding 3D drop-edge (`0 5px 0 #009BB0`), and bottom ambient shadow. Active state shifts Y down by 3px with shadow flattening to 2px.
- **Icon Power-Up Buttons (Undo, Restart, +Tube):** Circular acrylic pills (`48px x 48px`). Glass surface with a subtle floating badge indicator showing remaining inventory quantity at the top right.

### Floating HUD Badges
- **Level & Currency Trackers:** Frosted acrylic capsules with wood/golden metallic rim accents.
- **Coin Badge:** Solar Amber highlight (`#FFD13B`) with embedded glossy coin icon; numerical text aligned right using `counter-num`.

### Cards & Celebration Dialogs
- **Victory Modal:** Curvature of 32px, deep navy acrylic background, crowned with glowing volumetric ribbon banners. Features stars glowing with Solar Amber and Neon Rose particle bursts.
- **Level Progress Bar:** Rounded capsule track with a translucent dark groove; filled bar features an animated diagonal gloss sheen running along the vibrant cyan/violet gradient fill.

### Selection & Focus States
- Selected tubes show subtle vertical bobbing animation (+/- 4px ease-in-out).
- Inactive buttons mute to 45% opacity with removed drop-edge extrusion.