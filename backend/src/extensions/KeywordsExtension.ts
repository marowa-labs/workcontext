import { Node } from "@tiptap/core";

export const KeywordsExtension = Node.create({
  name: "keywords",

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
        tag: "div[data-type='keywords']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "keywords" }, 0];
  },
});

export default KeywordsExtension;
