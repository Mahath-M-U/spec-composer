# Spec Composer interface style guide

Use this guide to transfer the application's interface style to another product: navigation, dashboards, forms, tool panels, cards and workspace chrome. Preserve the destination app's content, workflows and domain language. Authored posters, artwork, brand kits and canvas documents have their own colors and fonts; they are not the interface palette.

## Visual character

- Warm linen backgrounds in light mode; soft ink backgrounds in dark mode. Avoid pure white/black as the default application surfaces.
- Compact Manrope typography, strong small headings, quiet supporting text and selective accent color.
- Flat, thin bordered controls and cards. Depth comes primarily from surface changes and spacing; floating shell elements can use restrained shadows.
- Rounded geometry with a clear hierarchy: 20px floating editor containers, 12px preview cards, 8px fields/popovers and smaller internal controls.
- A subtle dotted editor shell surrounds a solid workspace. Keep document artwork independent of theme switching.

Values below are observed in the source unless marked as an adaptation. The starter CSS is a deliberately small, framework-neutral adaptation rather than a replacement stylesheet for this repository.

## Color tokens

Apply `.dark` to the document root for dark mode. Apply `data-primary-color="red|amber|green|blue|violet"` to the same root for an accent choice. Red is the default; the old stylesheet comment referring to amber actions is stale. The accent stays the same across themes.

| Accent       | Exact value |
| ------------ | ----------- |
| Red, default | `#c55454`   |
| Amber        | `#c47a36`   |
| Green        | `#539e55`   |
| Blue         | `#638ed6`   |
| Violet       | `#a586d8`   |

### Application surfaces

Token names here omit the `--` prefix. The app exposes these through `--color-*` aliases; plain CSS can use the semantic tokens directly.

| Token / role                                                                 | Light                     | Dark                      |
| ---------------------------------------------------------------------------- | ------------------------- | ------------------------- |
| `background`, `sidebar`                                                      | `#efe9de`                 | `#141413`                 |
| `foreground`, `card-foreground`, `popover-foreground`, `sidebar-foreground`  | `#141413`                 | `#efe9de`                 |
| `card`, `popover`, `surface-raised`                                          | `#efe9de`                 | `#1c1b19`                 |
| `primary`, `accent`, `ring`, sidebar primary/accent/ring                     | Selected accent           | Selected accent           |
| `primary-foreground`, `accent-foreground`, sidebar primary/accent foreground | `#141413`                 | `#141413`                 |
| `secondary`                                                                  | `#ded4c4`                 | `#292724`                 |
| `secondary-foreground`                                                       | `#141413`                 | `#efe9de`                 |
| `muted`                                                                      | `#e5ddcf`                 | `#242320`                 |
| `muted-foreground`                                                           | `#6e675d`                 | `#aaa195`                 |
| `border`, `sidebar-border`                                                   | `#d2c7b7`                 | `#393631`                 |
| `input`                                                                      | `#a99d8b`                 | `#554f47`                 |
| `surface-subtle`                                                             | `#e5ddcf`                 | `#201f1d`                 |
| `destructive`                                                                | `oklch(0.492 0.143 16.2)` | `oklch(0.571 0.154 14.9)` |
| `destructive-foreground`                                                     | `#efe9de`                 | `#efe9de`                 |

Use destructive color for destructive states, independently of the selected accent. Preserve the exact OKLCH values above rather than substituting the stylesheet's approximate hex comments.

### Editor surfaces and cascade

The early root `--editor-*` tokens are a base layer. Later scoped `--color-editor-*` declarations replace their colors on the editor shell, skeleton and named editor popovers. Use the **effective chrome** values when recreating the current editor.

| Role              | Base light / dark     | Effective chrome light / dark |
| ----------------- | --------------------- | ----------------------------- |
| Editor background | `#e5ddcf` / `#141413` | `#e9e4dc` / `#141414`         |
| Editor surface    | `#e5ddcf` / `#1c1b19` | `#f5f1eb` / `#1e1e1e`         |
| Hover             | `#ded4c4` / `#2b2925` | `#e0d9cf` / `#282828`         |
| Border            | `#c9bdac` / `#393631` | `#c9c0b5` / `#363636`         |
| Foreground        | `#141413` / `#efe9de` | `#211f1c` / `#f0efed`         |
| Muted foreground  | `#6e675d` / `#aaa195` | `#625d56` / `#aba7a1`         |

Inside the tool rail, contextual panel, right panel and editor top bar, later overrides bind `--editor-action`, `--editor-accent-ink`, `--editor-focus` and `--field-ring` to the selected primary. Action foreground is `#141413`. Selected fills commonly mix the accent at 12–16%; they are not fully saturated panels.

There are intentional exceptions: editor canvas selection remains `#a84240` light / `#ce7773` dark, and some standalone portals retain scoped action defaults. Do not globally replace all authored or selection colors with primary. Later sidebar field rules use a 2px `currentColor` focus outline; segmented controls use the accent focus token. The starter below standardizes its own focus outline to accent for a simpler handoff.

## Typography, spacing and shape

Load **Manrope** in the destination app, including the weights you use; the repository's UI sans token is `"Manrope", sans-serif`. Its serif token is `"Instrument Serif", serif`, suitable for deliberate editorial accents. The larger font import in the root route also serves artwork and is not a list of required UI fonts.

| Element              | Observed treatment                                                            |
| -------------------- | ----------------------------------------------------------------------------- |
| Home hero title      | `clamp(20px, 1.6vw, 24px)`, weight 800, line-height 1.16, tracking `-0.045em` |
| Preview card title   | 14px, weight 650                                                              |
| Preview subtitle     | 12px, line-height 1.5, muted                                                  |
| Editor section title | 12px, weight 750, tracking `-0.01em`                                          |
| Editor eyebrow       | 9px, weight 750, uppercase, tracking `0.08em`                                 |
| Editor metadata      | 10px, muted; use tabular numbers for counts                                   |
| Segmented item       | 11px, weight 600; 12px icon                                                   |
| Menu item            | 12px; small menu icons usually 14px                                           |

Observed spacing repeats 2, 4, 6, 8, 10, 12, 16 and 24px, with larger gaps between dashboard sections. Treat these as a useful vocabulary rather than a universal enforced scale. At a 16px root size, generic format grids use 28px row / 16px column gaps; home grids override this to 28px / 20px.

The base radius token is `0.75rem`. Shared icon buttons use 6px corners, toolbar buttons 6px, segmented tracks/items 9px/7px and shared menu items 4px. Current editor fields and portal surfaces use 8px. Avoid making everything a pill.

Shared primitives, normalized editor fields/popovers and hovered discovery preview cards have no shadow. Some floating editor chips and controls use an 80% editor-surface glass fill, 14px backdrop blur and a theme-dependent shadow: light `0 20px 48px -16px` with foreground at 30%, dark `0 24px 64px -16px` with black at 70%. The rail and major panels have later solid-surface treatments; reserve glass for genuinely floating controls.

## Layout recipes

### Discovery and dashboard

- At 768px and above, use a sticky, full-height 268px sidebar and a `minmax(0, 1fr)` content column. Give the sidebar a thin right border and independent vertical scrolling.
- Below 768px, replace the sidebar with a mobile header: minimum 64px high plus safe-area padding, 28px brand icon and 48px create/menu targets. Navigation opens in a scrollable sheet up to 360px wide.
- Build the main sequence as a compact hero, prominent search, horizontally reachable category filters, section title/count and a responsive grid. Keep search and category state visually obvious. Empty states should offer a clear next action.
- Generic format grids progress from one column to two at 560px, three at 900px and four at 1280px. Home uses higher-specificity auto-fit grids: 140px minimum cards, 130px on narrow screens; its popular-format grid uses a 210px minimum. Adapt the grid to the destination's content rather than forcing one count everywhere.
- Home content uses 10% horizontal padding; generic discovery content uses 24px at desktop and 36px at 1280px. Preserve readable content margins while allowing previews to occupy the page.

### Editor workspace

- Desktop is a full-height grid: rail, contextual panel, 12px resize handle, flexible workspace, 12px resize handle, right panel. Outer spacing is 12px. Current inline rail tracks are 84.8px compact / 324.8px expanded, overriding earlier stylesheet widths.
- Left and right panel state starts collapsed. When opened, initial widths are 432px / 624px; resize controls allow 360–680px. These are current app measurements, not mandatory dimensions for every destination product.
- At 1099px and below, panels become overlay drawers, handles disappear and only one drawer opens at a time. Use a dimmed backdrop and preserve separate desktop/drawer visibility state. Escape closes the active drawer and returns focus to its control.
- Below 768px, later rules replace the desktop grid with header, flexible canvas and bottom tool rows. The bottom rail reserves 72px plus the bottom safe area. Keep compact icon captions accessible even where visually hidden.
- The shell dots are a 1px radial dot at 12% foreground on a 22px square grid. The workspace stays solid; its canvas has separate zoom-aware dots. Do not bake interface dots into exported artwork.

## Component and state recipes

| Component               | Recipe                                                                                                                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary action          | Selected primary fill, dark ink foreground, compact bold label; reserve for meaningful actions. Some editor actions intentionally use neutral surfaces.                                                          |
| Secondary action        | Surface or transparent fill, thin border, foreground label; hover moves to the next neutral surface.                                                                                                             |
| Icon button             | Shared minimum height 34px, 8px padding, 6px radius, muted icon. Hover uses editor-hover; pressed/open uses an accent tint and stronger accent-mixed border. Provide a name through text or an accessible label. |
| Field                   | Thin editor border, editor background, 8px corners, muted placeholder, no shadow. Hover strengthens the border. Sidebar focus uses a 2px foreground outline with 2px offset; preserve invalid-state styling.     |
| Segmented group         | Equal-width grid, 3px track padding, 4px gap, 9px track/7px item corners; default item height 30px. Selected item has accent at 12% over surface, a 45% accent border, neutral text and accent icon.             |
| Popover/menu            | Editor-surface fill, 1px border, 8px corners, no shadow. Small item padding is 8px; highlighted items use editor-hover. Named editor menus may have denser 28px rows.                                            |
| Preview card            | 12px outer radius, 8px padding, subtle fill and 1px border. Media has 9px corners and its own border. Metadata padding is `10px 3px 4px`, with 4px gap.                                                          |
| Preview hover/open      | Mix primary at 60% into the normal border, use secondary fill and no hover shadow. Keyboard focus within adds a 2px accent outline with 3px offset.                                                              |
| Disabled segmented item | Transparent fill/border, muted text, opacity 0.45 and `not-allowed` cursor. Do not give disabled controls interactive hover feedback.                                                                            |

Do not assume all buttons or fields have the same height: shared editor controls are compact, while mobile navigation targets are larger. For coarse pointers, shared segmented items grow to at least 44px. Keep touch actions reachable without hover; preview badges reveal on hover/focus for fine pointers.

Use short background/border changes: discovery preview cards use 160ms ease; several sidebar/card transitions use 180ms ease; overlay drawer entrance is 180ms ease-out when motion is allowed. Avoid decorative bouncing or large hover elevation. Disable nonessential transitions/animation for reduced-motion preferences. Use native controls and semantic selected/pressed/expanded states; the visual tokens alone do not guarantee accessibility or contrast for every combination.

## Copy-ready starter CSS

Load Manrope before using this CSS. Put theme/accent attributes on `<html>`, for example `<html class="dark" data-primary-color="blue">`. This uses plain CSS, including modern `color-mix()`. It needs no React, Tailwind or application runtime.

The example provides an adapted dashboard shell and reusable controls, not the editor's full resizing/drawer implementation. For `.card`, use `.card-media`, `.card-meta`, `.card-title` and `.card-subtitle` children. A `.segmented` contains buttons with `aria-selected="true"` for the active item; provide the appropriate behavior and ARIA pattern in the destination app.

```css
:root {
  --app-primary: #c55454;
  --background: #efe9de;
  --foreground: #141413;
  --card: #efe9de;
  --secondary: #ded4c4;
  --muted: #e5ddcf;
  --muted-foreground: #6e675d;
  --border: #d2c7b7;
  --input: #a99d8b;
  --surface-subtle: #e5ddcf;
  --surface-raised: #efe9de;
  --destructive: oklch(0.492 0.143 16.2);
  --destructive-foreground: #efe9de;
  --editor-bg: #e9e4dc;
  --editor-surface: #f5f1eb;
  --editor-hover: #e0d9cf;
  --editor-border: #c9c0b5;
  --editor-foreground: #211f1c;
  --editor-muted: #625d56;
  --primary: var(--app-primary);
  --primary-foreground: #141413;
  --ring: var(--primary);
  --font-sans: "Manrope", sans-serif;
  --font-serif: "Instrument Serif", serif;
}
.dark {
  --background: #141413;
  --foreground: #efe9de;
  --card: #1c1b19;
  --secondary: #292724;
  --muted: #242320;
  --muted-foreground: #aaa195;
  --border: #393631;
  --input: #554f47;
  --surface-subtle: #201f1d;
  --surface-raised: #1c1b19;
  --destructive: oklch(0.571 0.154 14.9);
  --editor-bg: #141414;
  --editor-surface: #1e1e1e;
  --editor-hover: #282828;
  --editor-border: #363636;
  --editor-foreground: #f0efed;
  --editor-muted: #aba7a1;
}
[data-primary-color="red"] {
  --app-primary: #c55454;
}
[data-primary-color="amber"] {
  --app-primary: #c47a36;
}
[data-primary-color="green"] {
  --app-primary: #539e55;
}
[data-primary-color="blue"] {
  --app-primary: #638ed6;
}
[data-primary-color="violet"] {
  --app-primary: #a586d8;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font: 14px/1.5 var(--font-sans);
}
button,
input,
select,
textarea {
  font: inherit;
}
button {
  cursor: pointer;
}
.app-shell {
  min-height: 100dvh;
}
.sidebar {
  display: none;
}
.mobile-header {
  min-height: 64px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
}
.content {
  min-width: 0;
  padding: 24px 16px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
  gap: 28px 20px;
}
.card {
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-subtle);
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}
.card:is(:hover, [data-menu-open]) {
  border-color: color-mix(in oklab, var(--primary) 60%, var(--border));
  background: var(--secondary);
  box-shadow: none;
}
.card-media {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 9px;
}
.card-meta {
  display: grid;
  gap: 4px;
  padding: 10px 3px 4px;
}
.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
}
.card-subtitle {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 12px;
}
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--foreground);
  font-size: 12px;
  font-weight: 650;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}
.button:hover:not(:disabled) {
  background: var(--secondary);
}
.button-primary {
  border-color: var(--primary);
  background: var(--primary);
  color: var(--primary-foreground);
}
.button-primary:hover:not(:disabled) {
  background: color-mix(in oklab, var(--primary) 90%, var(--foreground));
}
.icon-button {
  width: 34px;
  padding: 8px;
  border-radius: 6px;
  color: var(--muted-foreground);
}
.icon-button svg {
  width: 16px;
  height: 16px;
}
.field {
  width: 100%;
  min-height: 34px;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card);
  color: var(--foreground);
  box-shadow: none;
}
.field::placeholder {
  color: var(--muted-foreground);
}
.field:hover:not(:disabled) {
  border-color: var(--input);
}
.editor-theme {
  --background: var(--editor-bg);
  --foreground: var(--editor-foreground);
  --card: var(--editor-surface);
  --secondary: var(--editor-hover);
  --border: var(--editor-border);
  --muted-foreground: var(--editor-muted);
  background: var(--background);
  color: var(--foreground);
}
.editor-theme .field {
  background: var(--editor-bg);
}
.dotted-shell {
  background-color: var(--editor-bg);
  background-image: radial-gradient(
    circle,
    color-mix(in srgb, var(--editor-foreground) 12%, transparent) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
}
.workspace {
  min-width: 0;
  background: var(--editor-bg);
}
.segmented {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  gap: 4px;
  padding: 3px;
  border-radius: 9px;
  background: color-mix(in oklab, var(--foreground) 4%, var(--card));
}
.segmented > button {
  min-width: 0;
  min-height: 30px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 11px;
  font-weight: 600;
}
.segmented > button:hover:not(:disabled) {
  background: var(--secondary);
  color: var(--foreground);
}
.segmented > button[aria-selected="true"] {
  border-color: color-mix(in oklab, var(--primary) 45%, transparent);
  background: color-mix(in oklab, var(--primary) 12%, var(--card));
  color: var(--foreground);
}
.segmented > button[aria-selected="true"] svg {
  color: var(--primary);
}
:is(button, a, input, select, textarea):focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
.card:focus-within:has(:focus-visible) {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
}
button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
.segmented > button:disabled {
  border-color: transparent;
  background: transparent;
  color: var(--muted-foreground);
}
@media (min-width: 768px) {
  .app-shell {
    display: grid;
    grid-template-columns: 268px minmax(0, 1fr);
  }
  .sidebar {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 0;
    height: 100dvh;
    overflow-y: auto;
    padding: 20px 18px;
    border-right: 1px solid var(--border);
  }
  .mobile-header {
    display: none;
  }
  .content {
    padding: 32px 24px;
  }
}
@media (pointer: coarse) {
  .segmented > button,
  .button {
    min-height: 44px;
  }
  .icon-button {
    min-width: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .card,
  .button,
  .field,
  .segmented > button {
    transition: none;
    animation: none;
  }
}
```

## Reuse prompt

> Apply the attached Spec Composer DESIGN.md to this app's interface. Preserve its existing functionality, content and information hierarchy. Use Manrope, the exact warm linen/soft ink light and dark palettes, the effective editor palette for dense tool surfaces, and red #c55454 as the default selectable accent. Build compact bordered controls, restrained neutral surfaces, 12px preview cards, 8px fields/popovers, quiet metadata and clear keyboard focus. Use accent tints for selection, short state transitions and reduced-motion support. Adapt navigation and grids to the app's content and screen sizes. Keep authored content colors independent from interface theme. Treat the starter CSS as an implementation seed and retain the destination framework's conventions.

## Source map and maintenance

- [src/styles.css](src/styles.css): application palette/selectable accents near lines 76–186; font and base editor tokens near 203–242; layout near 3321 and 10302–10479; effective editor palette near 10482–10529; floating-shell/action overrides near 13193–13400; dot treatment near 13787; phone layout near 14364; final preview cards near 16034; normalized fields/portals near 16471.
- [ui-primitives.css](src/features/spec-composer/ui-primitives.css): shared section headings, segmented controls, menus, icon buttons, focus, touch and motion rules.
- [discovery.tsx](src/features/spec-composer/discovery.tsx): dashboard/sidebar composition, mobile navigation and search/filter/grid hierarchy.
- [Editor.tsx](src/features/spec-composer/Editor.tsx): current rail and panel state dimensions, shell composition and resizing limits.
- [use-sidebar-layout.ts](src/features/spec-composer/use-sidebar-layout.ts): 1099px drawer breakpoint, collapsed defaults, Escape and focus behavior.
- [primary-color.ts](src/lib/primary-color.ts): available accents and red default.
- [__root.tsx](src/routes/__root.tsx): font loading; many imported families support authored content.

When reconciling this guide with future changes, inspect later and more specific stylesheet rules as well as inline dimensions. Screenshots were not used to infer unverified measurements. Before shipping a destination implementation, check its actual content, theme contrast, keyboard interaction and touch layout.
