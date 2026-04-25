import { Node } from "@tiptap/core";

export const QuoteBlockExtension = Node.create({
  name: "quote-block",

  group: "block",

  content: "text*",

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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="quote-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "quote-block" }, 0];
  },
});

export default QuoteBlockExtension;
