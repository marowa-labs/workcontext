import { Node } from "@tiptap/core";

export const FigureExtension = Node.create({
  name: "figure",

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
      span: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-span"),
        renderHTML: (attributes) => {
          if (!attributes.span) {
            return {};
          }
          return {
            "data-span": attributes.span,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='figure']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "figure" }, 0];
  },
});

export default FigureExtension;
