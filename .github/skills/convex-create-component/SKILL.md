---
name: convex-create-component
description: Create Convex backend components for React applications. Use when building Convex backend functions, queries, mutations, actions, database schemas, or integrating Convex into a React app. Covers Convex functions, schema design, real-time subscriptions, and best practices for the Convex backend platform.
license: MIT
metadata:
  author: get-convex
  version: "1.0.0"
---

# Convex — Create Component

Create Convex backend components for React applications.

## When to Use This Skill

Apply when:

- Building Convex backend functions (queries, mutations, actions)
- Designing Convex database schemas
- Setting up real-time subscriptions
- Integrating Convex into a React app
- Creating reusable Convex components
- Managing Convex data and relationships

## Core Concepts

### 1. Convex Overview

Convex is a backend platform for React apps that provides:

- A reactive database with real-time subscriptions
- Server functions (queries, mutations, actions)
- Automatic caching and invalidation
- TypeScript-first development
- File storage

### 2. Convex Functions

Three types of server functions:

```ts
// Query — read data, reactive
export const getTodos = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("todos").collect();
  },
});

// Mutation — write data
export const addTodo = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("todos", { text: args.text, done: false });
  },
});

// Action — external side effects, non-reactive
export const callExternalApi = action({
  args: {},
  handler: async (ctx) => {
    // fetch external APIs, run long tasks
  },
});
```

### 3. Schema Design

Define your database schema with `defineSchema`:

```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    text: v.string(),
    done: v.boolean(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),
});
```

- Use `v.string()`, `v.number()`, `v.boolean()`, `v.id()`, `v.array()`, `v.object()`
- Define indexes for common query patterns
- Use `v.optional()` for nullable fields

### 4. Real-Time Subscriptions

Convex queries are reactive by default — the UI updates automatically when data changes:

```tsx
const todos = useQuery(api.todos.get);
```

- `useQuery` subscribes to reactive updates
- `useMutation` calls mutations
- `useAction` calls actions
- `useConvex` for imperative access

### 5. Best Practices

- Keep queries small and focused
- Use indexes for filtered queries
- Validate args with validators (`v.*`)
- Use actions for external API calls and side effects
- Batch related writes in a single mutation
- Use `ctx.storage` for file uploads
- Handle loading and error states in the UI

## Component Structure

A typical Convex component includes:

1. **Schema** — table definitions and indexes
2. **Queries** — read functions with validators
3. **Mutations** — write functions with validators
4. **Actions** — external side effects
5. **React hooks** — `useQuery`, `useMutation`, `useAction` integration

## Resources

- [Convex Agent Skills](https://github.com/get-convex/agent-skills) — source repository
- [Convex Docs](https://docs.convex.dev) — official documentation
