"use client";

import { Node, mergeAttributes, RawCommands } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columnExtension: {
      setColumns: (count: number) => ReturnType;
      unsetColumns: () => ReturnType;
    };
  }
}

export const ColumnExtension = Node.create({
  name: "columns",

  group: "block",

  content: "columnItem+",

  defining: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (element) => element.getAttribute("data-columns"),
        renderHTML: (attributes) => {
          return {
            "data-columns": attributes.columns,
            class: "columns",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-columns]",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const columns = element.getAttribute("data-columns");
          return columns ? { columns: parseInt(columns, 10) } : false;
        },
      },
      {
        tag: "div.columns",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "columns" }), 0];
  },

  addCommands() {
    return {
      setColumns:
        (count = 2) =>
        ({ commands }) => {
          const items = Array.from({ length: count }, () => ({
            type: "columnItem",
            content: [{ type: "paragraph" }],
          }));

          return commands.insertContent({
            type: this.name,
            attrs: { columns: count },
            content: items,
          });
        },
      unsetColumns:
        () =>
        ({ commands }) => {
          return commands.lift(this.name);
        },
    };
  },
});

export const ColumnItemExtension = Node.create({
  name: "columnItem",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      class: {
        default: "column-item",
        parseHTML: (element) => element.getAttribute("class"),
        renderHTML: (attributes) => {
          return {
            class: attributes.class || "column-item",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.column-item",
      },
      {
        tag: 'div[class="columns-column"]', // Support legacy
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: "column-item" }),
      0,
    ];
  },
});

export default { ColumnExtension, ColumnItemExtension };
