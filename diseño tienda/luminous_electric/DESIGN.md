---
name: Luminous Electric
colors:
  surface: '#f9f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f9f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f5'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e4'
  on-surface: '#1a1c1d'
  on-surface-variant: '#5b4137'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f0f2'
  outline: '#8f7065'
  outline-variant: '#e4beb1'
  surface-tint: '#a73a00'
  primary: '#a73a00'
  on-primary: '#ffffff'
  primary-container: '#ff5c00'
  on-primary-container: '#521800'
  inverse-primary: '#ffb59a'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#5e5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#939292'
  on-tertiary-container: '#2b2b2b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e2'
  tertiary-fixed-dim: '#c7c6c6'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9fb'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e4'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system shifts from a dark, brooding aesthetic to a high-clarity, high-energy light mode environment. It targets modern tech-savvy users who prioritize productivity and visual focus. The emotional response is one of surgical precision, optimism, and immediacy.

The style is a hybrid of **Minimalism** and **Modern Corporate**, utilizing expansive white space to let the "Electric Orange" primary color serve as a functional beacon for action. The interface feels like a premium native application—breathable, structured, and fast. By removing the heavy dark backgrounds, the system emphasizes content legibility and crisp interface boundaries.

## Colors

The palette is anchored by "Electric Orange" (#FF5C00), used exclusively for primary actions, active states, and critical highlights. 

- **Primary:** Electric Orange is the high-visibility driver of the UI.
- **Surface & Background:** The foundation is pure white (#FFFFFF). Elevated surfaces and containers use very light grays (#FAFAFA and #F5F5F7) to create subtle separation without introducing heavy shadows.
- **Typography & Contrast:** To maintain the "Obsidian" heritage in a light context, text uses a deep near-black (#1A1A1A) for maximum contrast and readability. Secondary text utilizes a mid-tone gray (#707070) to maintain hierarchy.
- **Accents:** Semantic colors (Success, Warning, Error) should follow a high-saturation profile similar to the primary orange to remain consistent with the vibrant brand energy.

## Typography

This design system leverages **Plus Jakarta Sans** for its modern, geometric, and friendly character. In this light-themed iteration, the font weight is used strategically to establish hierarchy against the white background.

- **Headlines:** High-weight (Bold/ExtraBold) with tight letter-spacing for a "tech-editorial" feel.
- **Body:** Regular weight for maximum legibility. Line heights are generous to prevent visual fatigue on bright screens.
- **Labels:** Semi-bold or Medium weights are used for UI controls and metadata to ensure they remain distinct from body copy even at smaller sizes.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** with a strict 4px baseline rhythm. 

- **Desktop:** 12-column grid with a 1200px max-width container, 20px gutters, and 64px side margins.
- **Mobile:** 4-column grid with 16px margins.
- **Rhythm:** Use "md" (16px) as the standard padding for components and "lg" (24px) for section vertical spacing.
- **Alignment:** Content should be left-aligned to reinforce the systematic, "app-like" feel. Grouped elements (like card sets) should use consistent gaps of 16px or 24px depending on the density required.

## Elevation & Depth

In this light-mode execution, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** Pure white (#FFFFFF).
- **Level 1 (Cards/Containers):** Soft gray (#FAFAFA) with a 1px solid border (#EEEEEE).
- **Level 2 (Floating/Modals):** Pure white with a very soft, diffused ambient shadow (Color: #1A1A1A at 4% opacity, 20px blur, 4px Y-offset).
- **Interactions:** Hover states on surface elements should trigger a subtle shift from #FAFAFA to #F5F5F7 to provide tactile feedback without visual clutter.

## Shapes

The design system uses a **Rounded** shape language to maintain its friendly and modern aesthetic. 

- **Standard Components:** Buttons, inputs, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Section containers and large cards use 1rem (16px) for a distinct "app" appearance.
- **Checkboxes:** Use a 4px radius to feel intentional and modern rather than clinical.
- **Icons:** Should feature rounded terminals and corners to match the radius of the containers.

## Components

- **Buttons:** 
  - *Primary:* Electric Orange background with White text. No border. 
  - *Secondary:* Deep Near-Black (#1A1A1A) background with White text.
  - *Tertiary:* Transparent background with Orange text and an 8px padding.
- **Input Fields:** Pure white background with a 1px #E0E0E0 border. On focus, the border becomes Electric Orange with a 2px outer "glow" using the orange at 10% opacity.
- **Cards:** Use Level 1 elevation (Surface color + soft border). Header text within cards should always be Bold/700 weight.
- **Chips/Tags:** Use the #F5F5F7 neutral gray background with #707070 text for inactive states; Electric Orange at 10% opacity with Orange text for active/selected states.
- **Lists:** Items separated by 1px #F0F0F0 dividers. 12px vertical padding for high-density, 16px for standard.
- **Checkboxes & Radios:** When checked, fill with Electric Orange and use a white check/dot. The stroke color for unchecked states should be #D1D1D6.