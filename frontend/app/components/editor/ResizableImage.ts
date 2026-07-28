import Image from "@tiptap/extension-image"

export interface ResizableImageOptions {
  inline: boolean
  allowBase64: boolean
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: {
        src: string
        alt?: string
        width?: number
        align?: "left" | "center" | "right"
        float?: "left" | "right"
      }) => ReturnType
      setImageWidth: (width: string | null) => ReturnType
      setImageAlign: (align: "left" | "center" | "right") => ReturnType
      setImageFloat: (float: "left" | "right" | null) => ReturnType
    }
  }
}

export const ResizableImage = Image.extend({
  name: "resizableImage",

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: null },
      align: { default: null },
      float: { default: null },
    }
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (el) => ({
          src: (el as HTMLImageElement).getAttribute("src"),
          alt: (el as HTMLImageElement).getAttribute("alt"),
          width: (el as HTMLImageElement).getAttribute("width"),
          align: (el as HTMLImageElement).getAttribute("data-align"),
          float: (el as HTMLImageElement).getAttribute("data-float"),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { align, float, ...attrs } = HTMLAttributes
    return [
      "img",
      {
        ...attrs,
        "data-align": align || undefined,
        "data-float": float || undefined,
      },
    ]
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; width?: string; align?: "left" | "center" | "right"; float?: "left" | "right" }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
              alt: options.alt || null,
              width: options.width || null,
              align: options.align || null,
              float: options.float || null,
            },
          } as any),
      setImageWidth:
        (width) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { width }),
      setImageAlign:
        (align) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { align }),
      setImageFloat:
        (float) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { float }),
    }
  },
})
