import { useEffect, useRef } from "react";
import TemplateService from "../templates/templateService";

// Hook to apply template styling to the editor
export const useTemplateStyling = (editor: any, project: any) => {
  const previousTemplateId = useRef<string | null>(null);
  const previousCitationStyle = useRef<string | null>(null);

  useEffect(() => {
    if (!editor || !project) return;

    // Check if template or citation style has changed
    const templateChanged = project.templateId !== previousTemplateId.current;
    const citationStyleChanged =
      project.citationStyle !== previousCitationStyle.current;

    if (templateChanged || citationStyleChanged) {
      // Update refs
      previousTemplateId.current = project.templateId || null;
      previousCitationStyle.current = project.citationStyle || null;

      // Apply citation style
      if (project.citationStyle) {
        editor.storage.citationStyle = project.citationStyle;
        console.log("Applied citation style:", project.citationStyle);
      }

      // Initialize citations storage if not already present
      if (!editor.storage.citations) {
        editor.storage.citations = [];
      }

      // Apply template styling if template ID exists
      if (project.templateId) {
        (async () => {
          await applyTemplateStyling(editor, project.templateId);
        })();
      }
    }
  }, [editor, project]);

  // Function to fetch and apply template styling
  const applyTemplateStyling = async (editor: any, templateId: string) => {
    try {
      // Fetch the template details
      const template = await TemplateService.getTemplateById(templateId);

      if (!template) {
        console.warn(`Template with ID ${templateId} not found`);
        return;
      }

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

      console.log(
        "Applied template styling for template:",
        templateId,
        template,
      );
    } catch (error) {
      console.error("Error applying template styling:", error);
    }
  };
};
