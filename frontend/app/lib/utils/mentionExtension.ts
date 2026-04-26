import { Mark, mergeAttributes } from "@tiptap/core";

export interface MentionOptions {
  HTMLAttributes: Record<string, any>;
}

export interface MentionAttributes {
  id: string;
  type: string;
  label: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mention: {
      /**
       * Insert a mention
       */
      insertMention: (attributes: MentionAttributes) => ReturnType;
    };
  }
}

export const MentionExtension = Mark.create<MentionOptions>({
  name: "mention",

  addOptions() {
    return {
      HTMLAttributes: {
        class: "mention",
      },
    };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-id": attributes.id };
        },
      },
      type: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => {
          if (!attributes.type) return {};
          return { "data-type": attributes.type };
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) return {};
          return { "data-label": attributes.label };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-mention]",
      },
    ];
  },

  renderHTML({ mark, HTMLAttributes }) {
    const attributes = mark.attrs as MentionAttributes;
    const typeColors: Record<string, string> = {
      user: "bg-blue-100 text-blue-700",
      page: "bg-purple-100 text-purple-700",
      space: "bg-green-100 text-green-700",
      task: "bg-orange-100 text-orange-700",
    };

    const colorClass = typeColors[attributes.type] || "bg-gray-100 text-gray-700";

    return [
      "span",
      mergeAttributes(
        {
          "data-mention": "",
          class: `mention ${colorClass} px-1.5 py-0.5 rounded font-medium cursor-pointer hover:opacity-80 transition-opacity`,
        },
        HTMLAttributes
      ),
      `@${attributes.label}`,
    ];
  },

  addCommands() {
    return {
      insertMention:
        (attributes) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: "text",
              marks: [
                {
                  type: this.name,
                  attrs: attributes,
                },
              ],
              text: `@${attributes.label}`,
            })
            .insertContent(" ")
            .run();
        },
    };
  },
});

export default MentionExtension;
