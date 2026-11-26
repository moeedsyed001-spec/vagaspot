# 07 — Brand and Design System

## 1. Brand direction

**Working name:** VAGASPOT  
**Tagline:** Your people. Your campus. Your spot.  
**Personality:** energetic, confident, slightly playful, friendly, campus-native and private. Not childish, not corporate, not surveillance-themed.

The product is about the friend group and campus life, not a tracking radar. Avoid crosshairs, target reticles, CCTV imagery or a pin that resembles a device-finder app.

## 2. Logo concept

Use a custom wordmark `VAGASPOT` with a compact “V + orbit/spot” mark:
- a bold V-shaped path or two angled strokes;
- a small dot/ring offset to represent a meeting spot;
- recognizable at 24 px as an app icon;
- no map-pin outline as the sole mark.

This is a concept direction, not a final trademark-cleared logo.

## 3. Colour tokens (provisional)

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--bg` | `#F7F7FB` | `#0D1220` | App background |
| `--surface` | `#FFFFFF` | `#171F2E` | Cards and panels |
| `--surface-2` | `#EEF0F6` | `#202B3C` | Secondary panels |
| `--text` | `#151827` | `#F7F8FC` | Primary text |
| `--muted` | `#667085` | `#AAB5C5` | Secondary text |
| `--primary` | `#6D45D8` | `#A78BFA` | Main actions and brand |
| `--accent` | `#B6E64A` | `#B6E64A` | Small energetic highlights, not long text |
| `--border` | `#E1E4EC` | `#303B4D` | Dividers and outlines |
| `--success` | `#15803D` | `#4ADE80` | On Campus / Free |
| `--info` | `#1D4ED8` | `#60A5FA` | In Class |
| `--warning` | `#B45309` | `#FBBF24` | Busy / stale warning |
| `--danger` | `#B42318` | `#F87171` | Destructive actions |

All combinations must be contrast-tested (WCAG AA target for normal text). Never depend on color alone; provide text labels and icons.

## 4. Typography

- Use `Inter` or a system sans stack; avoid loading multiple font families.
- Display: 24–32 px, 650–750 weight.
- Section heading: 18–22 px, 600–700.
- Body: 14–16 px, 400–500.
- Metadata: 12–13 px, 400–500; never make essential presence info too tiny.
- Numeric time labels use tabular numbers if available.

## 5. Spacing and shape

- Base spacing scale: 4, 8, 12, 16, 20, 24, 32.
- Main content padding: 16 px mobile; 24 px desktop.
- Card radius: 16 px; controls radius: 10–12 px; pill badges fully rounded.
- Subtle border and very restrained shadow; avoid glassmorphism and heavy gradients.
- Touch targets minimum 44x44 CSS px where possible.

## 6. Component styles

- Status badge: small icon + label; use semantic palette.
- Friend card: avatar/initial, name, campus badge, availability, zone and freshness in a consistent scan order.
- Ghost card: name/avatar and neutral “Presence hidden” text; no timestamp/status/zone.
- Primary button: brand purple, high contrast; one primary action per screen.
- Secondary action: outlined/quiet.
- Destructive action: red text/button plus confirmation.
- Zone chips: selectable, one active state, keyboard-accessible.
- Expiry helper: muted but visible near Save action.

## 7. Motion

- Short 120–180 ms feedback on status selection and save.
- Avoid repeated pulsing/radar animations.
- Respect `prefers-reduced-motion`.
- Loading skeletons are preferred over large animated spinners.

## 8. Tone and microcopy

Friendly, direct, short. Examples:
- “Where are you hanging out?”
- “You’re on campus.”
- “Your presence is hidden.”
- “Last updated 12 min ago.”
- “We couldn't sync that update. Try again.”
Avoid guilt-inducing copy (“You forgot to check in”) and surveillance language (“tracking enabled”). Use “Automatic campus detection”.

## 9. Accessibility

- Full keyboard navigation on web.
- Visible focus ring.
- Labels for every icon-only control.
- Screen reader announces save success/error and presence changes politely.
- Minimum contrast ratio WCAG AA target.
- Do not encode state by color alone.
- Test at 200% browser zoom and narrow viewport.
