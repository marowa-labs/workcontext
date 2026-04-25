import TemplateService from "./templateService";
import { applyTemplateContentWithValidation } from "./editorUtils";
/**
 * Apply template styling to the editor
 * @param {Object} editor - The Tiptap editor instance
 * @param {Object} project - The project data
 */
export async function applyTemplateStyling(editor, project) {
  if (!editor || !project) return;

  try {
    // Apply citation style for formatting citations
    if (project.citation_style) {
      // Store the citation style in editor storage for use when inserting citations
      editor.storage.citationStyle = project.citation_style;
    }

    // Initialize citations storage if not already present
    if (!editor.storage.citations) {
      editor.storage.citations = [];
    }

    // Apply template-based styling if available
    if (project.template_id) {
      // Use the template service to fetch and apply actual template styling
      const template = await TemplateService.getTemplateById(
        project.template_id
      );

      // Apply template colors to editor storage
      if (template.colors) {
        editor.storage.templateColors = template.colors;
      }

      // Apply template fonts to editor storage
      if (template.fonts) {
        editor.storage.templateFonts = template.fonts;
      }

      // Apply template sections if they exist
      if (template.sections) {
        editor.storage.templateSections = template.sections;
      }

      // Apply citation style from template if it exists
      if (template.citation_style) {
        editor.storage.citationStyle = template.citation_style;
      }

      // Apply template content if it exists
      if (template.content) {
        editor.storage.templateContent = template.content;
      }
    }
  } catch (error) {
    console.error("Error applying template styling:", error);
    // Don't throw the error to avoid breaking the editor
  }
}

/**
 * Convert template sections to editor content
 * @param {Array} sections - The template sections
 * @returns {Object} The Tiptap document structure
 */
export function convertTemplateSectionsToContent(sections) {
  // If no sections are provided, return an empty document to keep the editor blank
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    };
  }

  // Check if this is a seeded template with direct content structure
  // Seeded templates have content as an array of Tiptap nodes directly
  if (sections.length > 0 && sections[0].type) {
    // This appears to be a seeded template with direct content structure
    // The sections array is actually the content array in Tiptap format
    return {
      type: "doc",
      content: sections,
    };
  }

  // For templates with structured sections, convert them to content
  const contentNodes = [];

  sections.forEach((section) => {
    // Add section title as heading
    if (section.name) {
      contentNodes.push({
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: section.name }],
      });
    }

    // Add spacing after the title
    contentNodes.push({
      type: "paragraph",
      content: [],
    });

    // Add section components
    if (section.components && Array.isArray(section.components)) {
      section.components.forEach((component) => {
        switch (component.type) {
          case "textBlock":
            if (component.props && component.props.content) {
              contentNodes.push({
                type: "paragraph",
                content: [{ type: "text", text: component.props.content }],
              });
            }
            break;
          case "header":
            if (component.props && component.props.content) {
              contentNodes.push({
                type: "heading",
                attrs: { level: component.props.level || 3 },
                content: [{ type: "text", text: component.props.content }],
              });
            }
            break;
          case "list":
            if (component.props && component.props.items) {
              const listItems = component.props.items.map((item) => ({
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: item }],
                  },
                ],
              }));

              contentNodes.push({
                type: "bulletList",
                content: listItems,
              });
            }
            break;
          default:
            // For other component types, add a placeholder paragraph
            contentNodes.push({
              type: "paragraph",
              content: [],
            });
        }
      });
    }

    // Add spacing after section
    contentNodes.push({
      type: "paragraph",
      content: [],
    });
  });

  return {
    type: "doc",
    content: contentNodes,
  };
}

/**
 * Apply template content to editor
 * @param {Object} editor - The Tiptap editor instance
 * @param {Object} template - The template data
 */
export async function applyTemplateContent(editor, template) {
  if (!editor || !template) return;

  try {
    let contentToApply;

    // Handle different template structures
    if (template.content) {
      // For templates with direct content structure
      if (Array.isArray(template.content)) {
        contentToApply = {
          type: "doc",
          content: template.content,
        };
      } else if (template.content.sections) {
        // For templates with sections structure
        contentToApply = convertTemplateSectionsToContent(
          template.content.sections
        );
      } else {
        // For other content structures, use as-is
        contentToApply = template.content;
      }
    } else if (template.sections) {
      // For templates with sections at root level
      contentToApply = convertTemplateSectionsToContent(template.sections);
    } else {
      // Default to empty document
      contentToApply = {
        type: "doc",
        content: [
          {
            type: "paragraph",
          },
        ],
      };
    }

    // Apply the content to the editor with table validation
    return applyTemplateContentWithValidation(editor, contentToApply);
  } catch (error) {
    console.error("Error applying template content:", error);
    // Set editor to blank state on error
    return applyTemplateContentWithValidation(editor, {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    });
  }
}
