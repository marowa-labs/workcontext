import { Node } from "@tiptap/core";

export const VisualElementExtension = Node.create({
  name: "visual-element",

  group: "block",

  content: "block*",

  defining: true,

  addAttributes() {
    return {
      element: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-element"),
        renderHTML: (attributes) => {
          if (!attributes.element) {
            return {};
          }
          return {
            "data-element": attributes.element,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='visual-element']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "visual-element" }, 0];
  },
});

export default VisualElementExtension;
