import { Node } from "@tiptap/core";

export const AuthorExtension = Node.create({
  name: "author",

  group: "block",

  content: "text*",

  defining: true,

  addAttributes() {
    return {
      name: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-name"),
        renderHTML: (attributes) => {
          if (!attributes.name) {
            return {};
          }
          return {
            "data-name": attributes.name,
          };
        },
      },
      email: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-email"),
        renderHTML: (attributes) => {
          if (!attributes.email) {
            return {};
          }
          return {
            "data-email": attributes.email,
          };
        },
      },
      affiliation: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-affiliation"),
        renderHTML: (attributes) => {
          if (!attributes.affiliation) {
            return {};
          }
          return {
            "data-affiliation": attributes.affiliation,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='author']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "author" }, 0];
  },
});

export default AuthorExtension;
