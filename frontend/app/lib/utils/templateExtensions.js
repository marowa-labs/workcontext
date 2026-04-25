import { Node } from "@tiptap/core";
import { mergeAttributes } from "@tiptap/react";

// Custom extension for author-block nodes
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
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "author-block" }),
      0,
    ];
  },
});

// Custom extension for author nodes
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
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "author" }),
      0,
    ];
  },
});

// Custom extension for section nodes
export const SectionExtension = Node.create({
  name: "section",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {};
          }
          return {
            "data-title": attributes.title,
          };
        },
      },
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
        tag: "div[data-type='section']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "section" }),
      0,
    ];
  },
});

// Custom extension for keywords nodes
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
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "keywords" }),
      0,
    ];
  },
});

// Custom extension for code-block nodes (different from built-in codeBlock)
export const CustomCodeBlockExtension = Node.create({
  name: "code-block",

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
      language: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-language"),
        renderHTML: (attributes) => {
          if (!attributes.language) {
            return {};
          }
          return {
            "data-language": attributes.language,
          };
        },
      },
      "border-color": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-border-color"),
        renderHTML: (attributes) => {
          if (!attributes["border-color"]) {
            return {};
          }
          return {
            "data-border-color": attributes["border-color"],
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='code-block']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "code-block" }),
      0,
    ];
  },

  // Add the missing commands for code block functionality
  addCommands() {
    return {
      toggleCodeBlock:
        () =>
        ({ commands }) => {
          return commands.toggleWrap(this.name);
        },
      setCodeBlock:
        (attributes) =>
        ({ commands }) => {
          return commands.wrapIn(this.name, attributes);
        },
    };
  },
});

// Custom extension for figure nodes
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
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "figure" }),
      0,
    ];
  },
});

// Custom extension for list nodes (to handle legacy "list" node type)
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
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "list" }), 0];
  },
});

// Custom extension for callout-block nodes
export const CalloutBlock = Node.create({
  name: "callout-block",

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
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-color"),
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }
          return {
            "data-color": attributes.color,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "callout-block" }, 0];
  },
});

// Custom extension for visual-element nodes
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
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "visual-element" }),
      0,
    ];
  },
});

// Custom extension for cover-page nodes
export const CoverPageExtension = Node.create({
  name: "cover-page",

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
      background: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-background"),
        renderHTML: (attributes) => {
          if (!attributes.background) {
            return {};
          }
          return {
            "data-background": attributes.background,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="cover-page"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", { ...HTMLAttributes, "data-type": "cover-page" }, 0];
  },
});

// Custom extension for quote-block nodes
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

// Custom extension for pricing-table nodes
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

// Custom extension for sidebar-block nodes
export const SidebarBlockExtension = Node.create({
  name: "sidebar-block",

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
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) {
            return {};
          }
          return {
            "data-label": attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='sidebar-block']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "sidebar-block" }),
      0,
    ];
  },
});

// Custom extension for caption nodes
export const CaptionExtension = Node.create({
  name: "caption",

  group: "block",

  content: "text*",

  defining: true,

  addAttributes() {
    return {
      text: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-text"),
        renderHTML: (attributes) => {
          if (!attributes.text) {
            return {};
          }
          return {
            "data-text": attributes.text,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='caption']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "caption" }),
      0,
    ];
  },
});

// Custom extension for image-placeholder nodes
export const ImagePlaceholderExtension = Node.create({
  name: "image-placeholder",

  group: "block",

  content: "inline*",

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
        tag: "div[data-type='image-placeholder']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "image-placeholder" }),
      0,
    ];
  },
});

// Custom extension for presentation-deck nodes
export const PresentationDeckExtension = Node.create({
  name: "presentation-deck",

  group: "block",

  content: "block+",

  defining: true,

  addAttributes() {
    return {
      slides: {
        default: [],
        parseHTML: (element) => {
          const slidesData = element.getAttribute("data-slides");
          return slidesData ? JSON.parse(slidesData) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.slides || attributes.slides.length === 0) {
            return {};
          }
          return {
            "data-slides": JSON.stringify(attributes.slides),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='presentation-deck']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "presentation-deck" }),
      0,
    ];
  },
});

// Custom extension for citation-block nodes
export const CitationBlockExtension = Node.create({
  name: "citation-block",

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
      font: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-font"),
        renderHTML: (attributes) => {
          if (!attributes.font) {
            return {};
          }
          return {
            "data-font": attributes.font,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='citation-block']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "citation-block" }),
      0,
    ];
  },
});

// Custom extension for ai-tag nodes
export const AiTagExtension = Node.create({
  name: "ai-tag",

  group: "inline",

  content: "text*",

  inline: true,

  atom: true,

  addAttributes() {
    return {
      keywords: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-keywords"),
        renderHTML: (attributes) => {
          if (!attributes.keywords) {
            return {};
          }
          return {
            "data-keywords": attributes.keywords,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-type='ai-tag']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "ai-tag" }),
      0,
    ];
  },
});

// Custom extension for annotation-block nodes
export const AnnotationBlockExtension = Node.create({
  name: "annotation-block",

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
      font: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-font"),
        renderHTML: (attributes) => {
          if (!attributes.font) {
            return {};
          }
          return {
            "data-font": attributes.font,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='annotation-block']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "annotation-block" }),
      0,
    ];
  },
});
