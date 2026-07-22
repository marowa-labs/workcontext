import { Extension } from "@tiptap/core";
import { yCursorPlugin, defaultSelectionBuilder } from "@tiptap/y-tiptap";
import { DecorationAttrs } from "@tiptap/pm/view";

interface CollaborationCursorStorage {
  users: { clientId: number; [key: string]: any }[];
}

const awarenessStatesToArray = (
  states: Map<number, Record<string, any>>,
) => {
  return Array.from(states.entries()).map(([key, value]) => {
    return {
      clientId: key,
      ...value.user,
    };
  });
};

export interface CollaborationCursorOptions {
  provider: any;
  user: Record<string, any>;
  render(user: Record<string, any>): HTMLElement;
  selectionRender(user: Record<string, any>): DecorationAttrs;
}

export const SafeCollaborationCursor = Extension.create<
  CollaborationCursorOptions,
  CollaborationCursorStorage
>({
  name: "safeCollaborationCursor",

  addOptions() {
    return {
      provider: null,
      user: {
        name: null,
        color: null,
      },
      render: (user) => {
        const cursor = document.createElement("span");
        cursor.classList.add("collaboration-cursor__caret");
        cursor.setAttribute("style", `border-color: ${user.color}`);
        const label = document.createElement("div");
        label.classList.add("collaboration-cursor__label");
        label.setAttribute("style", `background-color: ${user.color}`);
        label.insertBefore(document.createTextNode(user.name), null);
        cursor.insertBefore(label, null);
        return cursor;
      },
      selectionRender: defaultSelectionBuilder,
    };
  },

  addStorage() {
    return {
      users: [],
    };
  },

  addCommands() {
    return {
      updateUser:
        (attributes) =>
        ({ editor }) => {
          this.options.user = attributes;
          this.options.provider.awareness.setLocalStateField(
            "user",
            this.options.user,
          );
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      yCursorPlugin(
        (() => {
          this.options.provider.awareness.setLocalStateField(
            "user",
            this.options.user,
          );
          this.storage.users = awarenessStatesToArray(
            this.options.provider.awareness.states,
          );
          this.options.provider.awareness.on("update", () => {
            this.storage.users = awarenessStatesToArray(
              this.options.provider.awareness.states,
            );
          });
          return this.options.provider.awareness;
        })(),
        {
          cursorBuilder: this.options.render,
          selectionBuilder: this.options.selectionRender,
        },
      ),
    ];
  },
});
