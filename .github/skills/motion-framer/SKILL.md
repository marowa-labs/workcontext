---
name: motion-framer
description: Master Motion (formerly Framer Motion), the production-ready animation library for React and JavaScript. Use when building animations, transitions, gestures, layout animations, scroll-based effects, or interactive motion in React applications. Covers motion components, variants, AnimatePresence, spring physics, and hooks. Works with Next.js, Vite, and Remix.
license: MIT
metadata:
  author: freshtechbro
  version: "1.0.0"
---

# Motion (Framer Motion)

Master Motion, the production-ready animation library for React and JavaScript.

## When to Use This Skill

Apply when:

- Animating React components
- Building page transitions and enter/exit animations
- Creating gesture-based interactions (hover, tap, drag)
- Adding layout animations
- Building scroll-based effects
- Creating spring-physics animations

## Core Concepts

### 1. Motion Components

Use `motion.*` components instead of regular DOM elements:

```jsx
import { motion } from "motion/react";

<motion.div animate={{ x: 100 }} />
<motion.button whileHover={{ scale: 1.1 }} />
```

### 2. The `animate` Prop

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
/>
```

- **`initial`** — starting state
- **`animate`** — target state
- **`transition`** — animation timing and physics

### 3. Transitions

```jsx
transition={{ duration: 0.5, ease: "easeOut" }}
transition={{ type: "spring", stiffness: 100, damping: 10 }}
```

- **Tween** — duration + easing
- **Spring** — physics-based (stiffness, damping, mass)
- **Timing** — keyframes

### 4. Variants

Define named animation states and orchestrate children:

```jsx
const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.div variants={variants} initial="hidden" animate="visible" />;
```

Use `staggerChildren` and `delayChildren` for orchestration.

### 5. Gestures

- **`whileHover`** — on hover
- **`whileTap`** — on press
- **`whileDrag`** — while dragging
- **`whileFocus`** — on focus
- **`whileInView`** — when scrolled into view

### 6. Hooks

- **`useAnimate`** — imperative animation control
- **`useSpring`** — spring-based values
- **`useInView`** — detect when element is in view
- **`useScroll`** — scroll progress
- **`useTransform`** — transform motion values
- **`useMotionValue`** — raw motion values

### 7. AnimatePresence

For enter/exit animations of mounting/unmounting components:

```jsx
<AnimatePresence>
  {isOpen && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>
```

### 8. Layout Animations

Animate layout changes smoothly:

```jsx
<motion.div layout />
```

Use `layoutId` to share layout animations between components (e.g., modal transitions).

### 9. Scroll-Based Effects

```jsx
const { scrollYProgress } = useScroll();
const scale = useTransform(scrollYProgress, [0, 1], [1, 0.5]);
```

## Framework Support

Motion works with:

- **Next.js** (App Router and Pages Router)
- **Vite**
- **Remix**
- Any React project

## Best Practices

- Use `motion` components for animated elements
- Prefer variants for complex, orchestrated animations
- Use spring physics for natural-feeling motion
- Use `AnimatePresence` for mount/unmount animations
- Use `layout` for smooth layout changes
- Respect `prefers-reduced-motion`

## Resources

- [Claude Design Skills](https://github.com/freshtechbro/claudedesignskills) — source repository
- [Motion Docs](https://motion.dev) — official documentation
