---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. Use when building or reviewing React and Next.js applications to ensure optimal performance, including eliminating waterfalls, reducing bundle size, optimizing server-side performance, client-side data fetching, re-render optimization, and rendering performance. Contains 70 rules across 8 categories.
license: MIT
metadata:
  author: vercel-labs
  version: "1.0.0"
---

# React & Next.js Best Practices

Performance optimization guidelines from Vercel Engineering for building fast, efficient React and Next.js applications.

## When to Use This Skill

Apply when:

- Building new React or Next.js applications
- Reviewing existing code for performance issues
- Optimizing page load times and bundle sizes
- Improving server-side rendering performance
- Reducing unnecessary re-renders
- Making data-fetching decisions

## The 8 Categories (70 Rules)

### 1. Eliminating Waterfalls (CRITICAL)

Waterfalls occur when requests happen sequentially instead of in parallel, adding latency to every step.

- **Parallelize data fetching** — fetch independent data in parallel, not sequentially
- **Avoid nested loading** — don't block rendering on sequential requests
- **Use `Promise.all`** for independent server-side fetches
- **Stream responses** to avoid blocking on slow endpoints
- **Prefetch** critical data early
- **Avoid client-side waterfalls** — batch requests, use React Query/SWR caching

### 2. Bundle Size Optimization (CRITICAL)

Smaller bundles load faster and improve performance on all devices.

- **Code-split** routes and heavy components with dynamic imports
- **Tree-shake** unused exports and dependencies
- **Use `next/dynamic`** for lazy-loaded components
- **Avoid importing entire libraries** — import only what you need
- **Audit dependencies** — remove or replace heavy packages
- **Use the Next.js bundle analyzer** to find large chunks

### 3. Server-Side Performance (HIGH)

- **Use Server Components** by default in Next.js App Router
- **Minimize server work** — avoid heavy computation in render
- **Cache aggressively** — use `revalidate`, `unstable_cache`, ISR
- **Move client logic to the server** where possible
- **Avoid blocking the server** with slow synchronous operations

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

- **Use a data-fetching library** (React Query, SWR) for caching and dedup
- **Cache responses** to avoid redundant requests
- **Handle loading and error states** gracefully
- **Prefetch data** the user is likely to need next
- **Avoid fetching on every render** — use stable dependencies

### 5. Re-render Optimization (MEDIUM)

- **Memoize** expensive components with `React.memo`
- **Use `useMemo` and `useCallback`** for expensive computations and stable callbacks
- **Avoid inline objects and functions** in props
- **Keep state local** — don't lift state unnecessarily
- **Use keys correctly** in lists
- **Avoid context re-renders** — split contexts by concern

### 6. Rendering Performance (MEDIUM)

- **Avoid layout thrashing** — batch DOM reads and writes
- **Use `content-visibility`** for off-screen content
- **Virtualize long lists** with react-window or react-virtualized
- **Debounce and throttle** expensive handlers
- **Use CSS transforms** instead of layout-triggering properties

### 7. JavaScript Performance (LOW-MEDIUM)

- **Avoid blocking the main thread** — chunk heavy work
- **Use Web Workers** for CPU-intensive tasks
- **Minimize event listener churn**
- **Avoid memory leaks** — clean up subscriptions and timers

### 8. Advanced Patterns (LOW)

- **Progressive enhancement** — build for resilience
- **Edge rendering** for dynamic content
- **Streaming** for incremental page delivery
- **Optimistic UI** for perceived performance

## Priority Order

Apply rules in priority order: **Waterfalls → Bundle Size → Server-Side → Client Fetching → Re-renders → Rendering → JS Performance → Advanced**. Fix the critical issues first for the biggest impact.

## Resources

- [Vercel Labs Agent Skills](https://github.com/vercel-labs/agent-skills) — source repository
