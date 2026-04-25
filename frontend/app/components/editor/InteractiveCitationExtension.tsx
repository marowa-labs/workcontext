import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

// Extension for interactive citation chips
export const InteractiveCitationExtension = Node.create({
  name: "citation-chip",

  group: "inline",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      label: {
        default: "1",
      },
      title: {
        default: "Citation",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='citation-chip']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-type": "citation-chip",
        class: "citation-chip",
      }),
      `[${HTMLAttributes.label}]`,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => {
      // In a real implementation, we might want a proper React component here
      // For now, simple rendering is fine, but we need click handling
      return (
        <span
          className="citation-chip cursor-pointer text-blue-600 hover:underline bg-blue-50 px-1 rounded mx-0.5"
          data-id={node.attrs.id}
          title={node.attrs.title}
          onClick={(e) => {
            e.stopPropagation(); // Prevent editor selection change if possible
            // Dispatch a custom event that MainEditor can listen to
            const event = new CustomEvent("citation-click", {
              detail: { id: node.attrs.id, title: node.attrs.title },
              bubbles: true,
            });
            e.target.dispatchEvent(event);
          }}>
          [{node.attrs.label}]
        </span>
      );
    });
  },
});
