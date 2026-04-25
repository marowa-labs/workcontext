/**
 * Template service for managing document templates
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: any; // The template content structure
  colors?: any; // Template color scheme
  fonts?: any; // Template font settings
  sections?: any; // Template sections
  citation_style?: string; // Template citation style
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  authorId?: string;
  usageCount: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface CreateTemplateData {
  name: string;
  description: string;
  category: string;
  content: any;
  isPublic?: boolean;
}

/**
 * Get all available templates
 * @param category Optional category to filter by
 * @param search Optional search term to filter by
 * @returns Promise resolving to array of templates
 */
export const getTemplates = async (
  category?: string,
  search?: string
): Promise<Template[]> => {
  // In a real implementation, this would fetch from an API
  // For now, we'll return mock templates
  return [
    {
      id: "academic-paper",
      name: "Academic Paper",
      description:
        "Standard academic paper template with abstract, introduction, methodology, results, and conclusion sections",
      category: "academic",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Title" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Abstract" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Abstract content goes here..." }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Introduction" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Introduction content goes here..." },
            ],
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 120,
    },
    {
      id: "research-proposal",
      name: "Research Proposal",
      description:
        "Template for research proposals with objectives, methodology, and timeline",
      category: "academic",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Research Proposal" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Objectives" }],
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Research objectives go here..." }],
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 85,
    },
    {
      id: "thesis-template",
      name: "Thesis Template",
      description:
        "Comprehensive thesis template with chapters and proper formatting",
      category: "academic",
      content: {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Thesis Title" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Chapter 1: Introduction" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Introduction content goes here..." },
            ],
          },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: true,
      usageCount: 210,
    },
  ];
};

/**
 * Get template by ID
 * @param templateId The template ID
 * @returns Promise resolving to the template
 */
export const getTemplateById = async (
  templateId: string
): Promise<Template | null> => {
  // In a real implementation, this would fetch from an API
  const templates = await getTemplates();
  return templates.find((template) => template.id === templateId) || null;
};

/**
 * Get all template categories
 * @returns Promise resolving to array of categories
 */
export const getTemplateCategories = async (): Promise<TemplateCategory[]> => {
  // In a real implementation, this would fetch from an API
  // For now, we'll return mock categories
  return [
    {
      id: "academic",
      name: "Academic",
      description: "Templates for academic papers, theses, and research",
      icon: "book",
    },
    {
      id: "business",
      name: "Business",
      description: "Templates for business documents and reports",
      icon: "briefcase",
    },
    {
      id: "creative",
      name: "Creative",
      description: "Templates for creative writing and storytelling",
      icon: "pen-tool",
    },
    {
      id: "technical",
      name: "Technical",
      description: "Templates for technical documentation",
      icon: "code",
    },
  ];
};

/**
 * Create a new template
 * @param data The template data to create
 * @returns Promise resolving to the created template
 */
export const createTemplate = async (
  data: CreateTemplateData
): Promise<Template> => {
  // In a real implementation, this would send a request to create the template
  console.log("Creating template:", data);

  return {
    id: `template_${Date.now()}`,
    name: data.name,
    description: data.description,
    category: data.category,
    content: data.content,
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: data.isPublic ?? false,
    usageCount: 0,
  };
};

/**
 * Update an existing template
 * @param templateId The template ID to update
 * @param data The template data to update
 * @returns Promise resolving to the updated template
 */
export const updateTemplate = async (
  templateId: string,
  data: Partial<CreateTemplateData>
): Promise<Template | null> => {
  // In a real implementation, this would send a request to update the template
  console.log(`Updating template ${templateId}:`, data);

  // For mock implementation, we'll just return a modified template
  return {
    id: templateId,
    name: data.name || `Updated Template ${templateId}`,
    description: data.description || "Updated template description",
    category: data.category || "academic",
    content: data.content || {},
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(),
    isPublic: data.isPublic ?? false,
    usageCount: 0,
  };
};

/**
 * Delete a template
 * @param templateId The template ID to delete
 * @returns Promise resolving when template is deleted
 */
export const deleteTemplate = async (templateId: string): Promise<boolean> => {
  // In a real implementation, this would send a request to delete the template
  console.log(`Deleting template: ${templateId}`);
  return true;
};

/**
 * Use a template to create a new document
 * @param templateId The template ID to use
 * @param documentName The name for the new document
 * @returns Promise resolving to the new document content
 */
export const useTemplate = async (templateId: string, documentName: string) => {
  // In a real implementation, this would create a new document based on the template
  console.log(
    `Using template ${templateId} to create document: ${documentName}`
  );

  const template = await getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template with ID ${templateId} not found`);
  }

  return {
    name: documentName,
    content: template.content,
  };
};

export default {
  getTemplates,
  getTemplateById,
  getTemplateCategories,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  useTemplate,
};
