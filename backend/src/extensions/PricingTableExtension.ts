import { Node } from "@tiptap/core";

export const PricingTableExtension = Node.create({
  name: "pricing-table",

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
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pricing-table"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "pricing-table" }, 0];
  },
});

export default PricingTableExtension;
