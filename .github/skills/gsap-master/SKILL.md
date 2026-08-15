---
name: gsap-master
description: Master GSAP (GreenSock Animation Platform) for creating high-performance web animations. Use when building animations, timelines, scroll-triggered effects, or interactive motion in web projects. Covers GSAP core, timelines, ScrollTrigger, plugins, React integration, and performance best practices. GSAP is 100% free including all plugins.
license: MIT
metadata:
  author: greensock
  version: "1.0.0"
---

# GSAP Master

Master GSAP (GreenSock Animation Platform) for creating smooth, high-performance web animations.

## When to Use This Skill

Apply when:

- Creating web animations (fades, slides, transforms, etc.)
- Building complex animation timelines
- Adding scroll-triggered effects
- Animating React components
- Creating interactive motion experiences
- Optimizing animation performance

## Core Concepts

### 1. GSAP Core

- **`gsap.to()`** — animate TO a state
- **`gsap.from()`** — animate FROM a state
- **`gsap.fromTo()`** — animate between explicit states
- **`gsap.set()`** — set values instantly (no animation)
- **`gsap.timeline()`** — create sequenced animations

### 2. Transform Aliases

Use transform aliases instead of raw transforms for cleaner, faster code:

```js
// Instead of transform: translateX(100px)
gsap.to(el, { x: 100 });

// Instead of transform: scale(1.5)
gsap.to(el, { scale: 1.5 });

// Instead of opacity with visibility handling
gsap.to(el, { autoAlpha: 0 }); // sets opacity AND visibility
```

- `x`, `y` — translate
- `scale`, `scaleX`, `scaleY` — scale
- `rotation` — rotate
- `autoAlpha` — opacity + visibility (better than opacity alone)

### 3. Timelines

Prefer timelines over chained `.delay()` for sequencing:

```js
const tl = gsap.timeline();
tl.to(el1, { x: 100, duration: 0.5 })
  .to(el2, { y: 50, duration: 0.5 }, "-=0.2") // overlap
  .to(el3, { opacity: 1, duration: 0.3 }, "<"); // start with previous
```

Position parameters: `"<"` (start with previous), `"-=0.2"` (overlap), `">"` (end of previous), absolute time.

### 4. ScrollTrigger

- **`gsap.matchMedia()`** — responsive and reduced-motion handling
- **`scrollTrigger: { trigger, start, end, scrub, toggleActions }`**
- Use `scrub` for scroll-linked animations
- Use `toggleActions` for play/pause/resume/reset on enter/leave

### 5. Plugins

GSAP is **100% free** including all plugins (since Webflow's acquisition):

- **ScrollTrigger** — scroll-based animations
- **SplitText** — text character/word/line animations
- **MorphSVG** — SVG morphing
- **DrawSVG** — SVG line drawing
- **MotionPath** — animate along a path
- **Flip** — FLIP animations for layout changes
- **Observer** — unified scroll/wheel/touch handling

### 6. React Integration

Use the **`useGSAP()`** hook for React:

```jsx
import { useGSAP } from "@gsap/react";

useGSAP(
  () => {
    gsap.to(".box", { x: 100 });
  },
  { scope: containerRef },
);
```

- Handles cleanup automatically
- Scopes selectors to a container
- Works with React StrictMode

### 7. Performance

- Use `transform` and `opacity` (GPU-accelerated) — avoid layout-triggering properties
- Use `will-change` sparingly
- Kill animations on unmount (`gsap.killTweensOf()`)
- Use `gsap.matchMedia()` for reduced-motion support
- Batch DOM reads/writes to avoid layout thrashing

## Best Practices

- Prefer timelines over chained delays
- Use `autoAlpha` instead of `opacity` for show/hide
- Use `gsap.matchMedia()` for responsive and reduced-motion
- Use `useGSAP` hook in React
- Animate transforms and opacity for performance
- Clean up animations on unmount

## Resources

- [GSAP Skills](https://github.com/greensock/gsap-skills) — source repository
- [GSAP Docs](https://gsap.com/docs) — official documentation
