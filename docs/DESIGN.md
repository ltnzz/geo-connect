---
name: AroundU
colors:
  surface: "#f8f9ff"
  surface-dim: "#cbdbf5"
  surface-bright: "#f8f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#eff4ff"
  surface-container: "#e5eeff"
  surface-container-high: "#dce9ff"
  surface-container-highest: "#d3e4fe"
  on-surface: "#0b1c30"
  on-surface-variant: "#434655"
  inverse-surface: "#213145"
  inverse-on-surface: "#eaf1ff"
  outline: "#737686"
  outline-variant: "#c3c6d7"
  surface-tint: "#0053db"
  primary: "#004ac6"
  on-primary: "#ffffff"
  primary-container: "#2563eb"
  on-primary-container: "#eeefff"
  inverse-primary: "#b4c5ff"
  secondary: "#855300"
  on-secondary: "#ffffff"
  secondary-container: "#fea619"
  on-secondary-container: "#684000"
  tertiary: "#006242"
  on-tertiary: "#ffffff"
  tertiary-container: "#007d55"
  on-tertiary-container: "#bdffdb"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#dbe1ff"
  primary-fixed-dim: "#b4c5ff"
  on-primary-fixed: "#00174b"
  on-primary-fixed-variant: "#003ea8"
  secondary-fixed: "#ffddb8"
  secondary-fixed-dim: "#ffb95f"
  on-secondary-fixed: "#2a1700"
  on-secondary-fixed-variant: "#653e00"
  tertiary-fixed: "#6ffbbe"
  tertiary-fixed-dim: "#4edea3"
  on-tertiary-fixed: "#002113"
  on-tertiary-fixed-variant: "#005236"
  background: "#f8f9ff"
  on-background: "#0b1c30"
  surface-variant: "#d3e4fe"
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: "700"
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "700"
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  gutter-mobile: 16px
  gutter-desktop: 24px
  margin-safe: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The brand identity centers on the intersection of physical exploration and digital community. The design system evokes a sense of "technological warmth"—combining the precision of geospatial data with the approachability of human connection. The UI focuses on three emotional pillars: **Discovery** (finding new places), **Trust** (safe social interactions), and **Precision** (accurate map-based utility).

The aesthetic utilizes **Modern Corporate** foundations blended with **Soft Minimalism**. It features high-quality whitespace to prevent information density from overwhelming the user, while using vibrant color accents to guide the eye toward interactive elements. The overall feel is "Smart-Casual": professional enough for a utility app, but vibrant enough for a social network.

## Colors

The color palette is functionally driven to ensure clear intent across the map and interface:

- **Connect Blue (Primary):** Used for core navigation, primary actions, and verified statuses. It represents the "glue" of the network.
- **Discovery Orange (Secondary):** Reserved for high-energy touchpoints—specifically map pins, active notifications, and "Live" discovery events.
- **Privacy Teal (Tertiary):** Applied strictly to security settings, encrypted chats, and location-sharing toggles to reinforce a sense of safety.
- **Backgrounds & Neutrals:** Surfaces use a very subtle cool-gray tint (`#F8FAFC`) to reduce eye strain, while text utilizes a deep Slate (`#0F172A`) for maximum contrast and legibility.

## Typography

The typography system relies on **Inter** for its neutral, systematic clarity. The hierarchy is designed to handle varying data types, from short location labels to long-form community posts.

- **Headlines:** Utilize tighter letter-spacing and heavier weights to create a strong visual anchor.
- **Body Text:** Optimized for readability with a generous line-height to manage dense social feeds.
- **Labels:** Specifically designed for map annotations and badges, using semi-bold weights at smaller sizes to remain legible against complex backgrounds.

## Layout & Spacing

This design system uses a **Fluid Grid** model with a base-4 vertical rhythm.

- **Mobile:** A 4-column layout with 16px margins. Content cards generally span the full width of the column set.
- **Desktop:** A 12-column layout with 24px margins. Sidebars are used for map controls and discovery filters, while the central area focuses on the map or feed.
- **Map Integration:** The map is treated as the "Bottom Layer" of the application. All UI components float on top of this layer using safe-area margins to ensure the map remains visible and interactive at the edges.

## Elevation & Depth

Visual hierarchy is established through **Ambient Shadows** and **Tonal Layering**.

1.  **Level 0 (Base):** The Map view.
2.  **Level 1 (Surface):** Feed cards and search bars. Use a soft shadow (0px 4px 12px, 5% opacity) to lift them slightly off the map.
3.  **Level 2 (Interaction):** Hover states and active buttons. Increased shadow spread (0px 8px 20px, 8% opacity).
4.  **Level 3 (Overlay):** Modals, bottom sheets, and location badges. These use a light backdrop blur (4px) to maintain the context of the map behind them.

Avoid harsh borders. Instead, use thin 1px strokes in a slightly darker neutral shade (`#E2E8F0`) to define boundaries on white backgrounds.

## Shapes

The shape language is consistently **Rounded**, reflecting the "friendly and secure" brand values.

- **Standard Cards/Inputs:** 16px (rounded-lg) radius.
- **Primary Buttons:** 12px radius for a balanced, modern look.
- **Badges/Location Tags:** Fully pill-shaped for immediate recognition as a metadata element.
- **Profile Avatars:** Circular to humanize the interface.

## Components

- **Tactile Buttons:** Primary buttons use a solid Connect Blue fill with a subtle 2px inner-bottom-shadow to create a "pressed" feel.
- **Location Badges:** Small pill-shaped containers with a 12px leading icon (e.g., Discovery Orange pin) and 12px label text.
- **Interactive Cards:** Social posts should feature a "Location Header"—a dedicated row at the top of the card showing the Discovery Orange pin and the distance from the user.
- **Input Fields:** Ghost-style inputs with 16px rounded corners. On focus, the border transitions to Connect Blue with a 2px stroke.
- **Map Markers:** Custom pin shapes with a white outer ring for contrast. Active markers scale up by 20% and glow with a soft Discovery Orange shadow.
- **Privacy Toggles:** Switch components that utilize Privacy Teal when active, accompanied by a small padlock icon for visual reinforcement.