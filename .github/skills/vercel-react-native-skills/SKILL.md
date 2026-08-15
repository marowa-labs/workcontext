---
name: vercel-react-native-skills
description: React Native and Expo best practices from Vercel Engineering. Use when building or reviewing React Native and Expo applications to ensure optimal performance and quality. Covers list performance, animation, navigation, UI patterns, state management, rendering, monorepo setup, and configuration. Contains 16 rules across 7 sections.
license: MIT
metadata:
  author: vercel-labs
  version: "1.0.0"
---

# React Native & Expo Best Practices

Best practices from Vercel Engineering for building fast, high-quality React Native and Expo applications.

## When to Use This Skill

Apply when:

- Building new React Native or Expo applications
- Reviewing existing React Native code for performance issues
- Optimizing list rendering and animations
- Setting up navigation
- Managing state in React Native apps
- Configuring monorepos for React Native

## The 7 Sections (16 Rules)

### 1. List Performance (CRITICAL)

Lists are the most common performance bottleneck in mobile apps.

- **Use `FlatList` or `SectionList`** instead of `ScrollView` + `map` for long lists
- **Virtualize lists** — only render visible items
- **Use `React.memo`** on list item components
- **Provide stable keys** for list items
- **Avoid inline functions** in render props (use `useCallback`)
- **Use `getItemLayout`** for fixed-height items to skip measurement
- **Avoid heavy components** in list items — keep them lightweight

### 2. Animation (HIGH)

- **Use the Animated API or Reanimated** for smooth animations
- **Use `useNativeDriver: true`** where possible for native performance
- **Animate transforms and opacity** — avoid layout-triggering properties
- **Avoid animating on the JS thread** — use native driver or Reanimated
- **Use `InteractionManager`** to defer non-critical work during animations

### 3. Navigation (HIGH)

- **Use React Navigation or Expo Router** for navigation
- **Lazy-load screens** — don't render all screens upfront
- **Use native stack navigation** for better performance
- **Avoid deep navigation stacks** — keep them shallow
- **Prefetch** data for likely-next screens

### 4. UI Patterns (HIGH)

- **Use Pressable** instead of TouchableOpacity for better feedback control
- **Respect safe areas** with SafeAreaView or useSafeAreaInsets
- **Use platform-specific styling** where needed (iOS vs Android)
- **Handle keyboard** properly (KeyboardAvoidingView)
- **Use proper image handling** — resize, cache, and lazy-load images

### 5. State Management (MEDIUM)

- **Keep state local** where possible
- **Use Context or a state library** (Zustand, Redux Toolkit) for shared state
- **Avoid unnecessary re-renders** — memoize selectors and components
- **Persist state** with AsyncStorage or MMKV when needed
- **Separate server state from UI state** (React Query, SWR)

### 6. Rendering (MEDIUM)

- **Avoid unnecessary re-renders** — use `React.memo`, `useMemo`, `useCallback`
- **Keep components small** and focused
- **Avoid inline styles** in hot paths (use StyleSheet.create)
- **Use `useWindowDimensions`** for responsive layouts
- **Avoid heavy work on the JS thread** — offload to native or workers

### 7. Monorepo (MEDIUM) & Configuration (LOW)

- **Use a monorepo** (Turborepo, Nx) for shared code across web and native
- **Share types and utilities** between web and native
- **Configure Metro** properly for monorepo resolution
- **Use Expo** for easier setup and over-the-air updates
- **Configure app icons, splash screens, and assets** properly
- **Set up environment variables** correctly for different environments

## Priority Order

Apply rules in priority order: **List Performance → Animation → Navigation → UI Patterns → State → Rendering → Monorepo/Config**. Fix the critical issues first for the biggest impact.

## Resources

- [Vercel Labs Agent Skills](https://github.com/vercel-labs/agent-skills) — source repository
