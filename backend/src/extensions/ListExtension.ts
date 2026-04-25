import { Node } from "@tiptap/core";

export const ListExtension = Node.create({
  name: "list",

  group: "block",

  content: "listItem+",

  defining: true,

  addAttributes() {
    return {
      listType: {
        default: "bullet",
        parseHTML: (element) => element.getAttribute("data-list-type"),
        renderHTML: (attributes) => {
          if (!attributes.listType) {
            return {};
          }
          return {
            "data-list-type": attributes.listType,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='list']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "list" }, 0];
  },
});

export default ListExtension;
