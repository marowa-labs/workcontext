import { Node } from "@tiptap/core";

export const AuthorBlockExtension = Node.create({
  name: "author-block",

  group: "block",

  content: "author*",

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
        tag: "div[data-type='author-block']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "author-block" }, 0];
  },
});

export default AuthorBlockExtension;
