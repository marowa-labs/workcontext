---
name: shadcn-ui-mcp-server
description: Use the shadcn/ui MCP server to fetch, inspect, and apply shadcn/ui components, blocks, and themes directly into your project. Use when you need to add shadcn/ui components, browse the component library, get component demos and metadata, apply themes, or work with shadcn/ui blocks. Supports React, Svelte, Vue, and React Native.
license: MIT
metadata:
  author: Jpisnice
  version: "1.0.0"
---

# shadcn/ui MCP Server

An MCP server that lets you fetch, inspect, and apply shadcn/ui components, blocks, and themes directly into your project.

## When to Use This Skill

Apply when:

- Adding shadcn/ui components to a project
- Browsing the shadcn/ui component library
- Getting component demos, metadata, or source code
- Applying shadcn/ui themes
- Working with shadcn/ui blocks (larger pre-built sections)
- Building with shadcn/ui in React, Svelte, Vue, or React Native

## Setup

Install and run the MCP server:

```bash
npx @jpisnice/shadcn-ui-mcp-server
```

Configure it as an MCP server in your client (VS Code, Claude, Cursor, etc.) pointing to the `npx` command above.

## Available Tools

### Component Tools

- **get_component** — Fetch the full source code of a shadcn/ui component
- **get_component_demo** — Get a live demo/preview of a component
- **list_components** — List all available shadcn/ui components
- **get_component_metadata** — Get metadata about a component (props, dependencies, etc.)

### Block Tools

- **get_block** — Fetch a shadcn/ui block (larger pre-built section)
- **list_blocks** — List all available blocks

### Theme & Structure Tools

- **get_directory_structure** — Get the project's directory structure
- **apply_theme** — Apply a shadcn/ui theme to the project

## Framework Support

The shadcn/ui MCP server supports:

- **React** (default)
- **Svelte**
- **Vue**
- **React Native**

## Workflow

1. **List components** to see what's available
2. **Get component metadata** to understand props and dependencies
3. **Fetch the component source** to add it to your project
4. **Get a demo** to see how it looks and behaves
5. **Apply a theme** to match your design system
6. **Use blocks** for larger, pre-built sections

## Resources

- [shadcn-ui-mcp-server](https://github.com/Jpisnice/shadcn-ui-mcp-server) — source repository
- [shadcn/ui](https://ui.shadcn.com) — component library
