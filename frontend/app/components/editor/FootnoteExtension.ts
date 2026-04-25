"use client";

import { Node, mergeAttributes } from "@tiptap/core";

export const FootnoteExtension = Node.create({
  name: "footnote",

  group: "inline",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            "data-id": attributes.id,
          };
        },
      },
      number: {
        default: 1,
        parseHTML: (element) => {
          const number = element.getAttribute("data-number");
          return number ? parseInt(number, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (!attributes.number) {
            return {};
          }
          return {
            "data-number": attributes.number,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='footnote']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "footnote",
        class: "footnote-ref",
      }),
      `${HTMLAttributes.number || 1}`,
    ];
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement("sup");
      dom.className = "footnote-ref";

      const link = document.createElement("a");
      link.href = `#fn:${HTMLAttributes.number || 1}`;
      link.id = `fnref:${HTMLAttributes.number || 1}`;
      link.textContent = `${HTMLAttributes.number || 1}`;

      dom.appendChild(link);

      return {
        dom,
      };
    };
  },
});

export const FootnoteContentExtension = Node.create({
  name: "footnoteContent",

  group: "block",

  content: "block+",

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) {
            return {};
          }
          return {
            "data-id": attributes.id,
          };
        },
      },
      number: {
        default: 1,
        parseHTML: (element) => {
          const number = element.getAttribute("data-number");
          return number ? parseInt(number, 10) : 1;
        },
        renderHTML: (attributes) => {
          if (!attributes.number) {
            return {};
          }
          return {
            "data-number": attributes.number,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='footnote-content']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "footnote-content",
        class: "footnote-content",
        id: `fn:${HTMLAttributes.number || 1}`,
      }),
      0,
    ];
  },
});

export default { FootnoteExtension, FootnoteContentExtension };
