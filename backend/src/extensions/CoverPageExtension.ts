import { Node } from "@tiptap/core";

export const CoverPageExtension = Node.create({
  name: "cover-page",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-style"),
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {};
          }
          return {
            "data-style": attributes.style,
          };
        },
      },
      background: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-background"),
        renderHTML: (attributes) => {
          if (!attributes.background) {
            return {};
          }
          return {
            "data-background": attributes.background,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cover-page"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "cover-page" }, 0];
  },
});

export default CoverPageExtension;
