import { prisma } from "../lib/prisma";

async function seedTemplates() {
  try {
    // Create sample templates
    const templates = [
      {
        name: "Premium Research Proposal (Grant Focus)",
        description:
          "A professionally formatted template for high-stakes research proposals, grants, or academic funding applications.",
        type: "research-paper",
        tags: ["research", "proposal", "funding", "premium", "institutional"],
        is_public: true,
        content: [
          {
            type: "cover-page",
            attrs: { style: "premium-academic" },
            content: [
              { type: "visual-element", element: "Gold Bar Header" },
              {
                type: "heading",
                attrs: {
                  level: 1,
                  color: "deep-blue",
                  font: "Montserrat-Bold",
                },
                content: [
                  {
                    type: "text",
                    text: "PROJECT TITLE: Addressing Fragmentation with AI-Powered Ecosystems",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 3 },
                content: [
                  {
                    type: "text",
                    text: "Principal Investigator: [Researcher Name]",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 3 },
                content: [
                  {
                    type: "text",
                    text: "Institution: [University/Research Lab Name]",
                  },
                ],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: "Submission Date: [Date]" }],
              },
              { type: "visual-element", element: "Teal Wave Graphic Footer" },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "1.0", color: "deep-blue" },
            content: [{ type: "text", text: "Executive Summary (The Hook)" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[AI Prompt: Generate a concise, 250-word summary of the project's goal, methodology, and expected impact. Focus on the novelty and funding requirement.]",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "2.0", color: "deep-blue" },
            content: [
              { type: "text", text: "Problem Statement and Significance" },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Detail the specific research gap the project addresses. Include citations showing a strong literature foundation. (Use the integrated **AI Summarization** tool for quick context.)",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "3.0", color: "deep-blue" },
            content: [
              { type: "text", text: "Project Methodology and Work Plan" },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Break the project into clear phases (e.g., Phase 1: Data Collection, Phase 2: Analysis). This section should easily integrate with the **Project Dashboard** for tracking.",
              },
            ],
          },
          {
            type: "table",
            attrs: { style: "two-tone-blue" },
            content: [
              { row: ["Milestone", "Timeline", "Responsible Party"] },
              {
                row: [
                  "[AI Milestones]",
                  "[AI Timeline]",
                  "[Collaborator Name]",
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "4.0", color: "deep-blue" },
            content: [{ type: "text", text: "Budget and Justification" }],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "5.0", color: "deep-blue" },
            content: [
              { type: "text", text: "Expected Outcomes and Dissemination" },
            ],
          },
        ],
      },
      {
        name: "Scientific Lab Report (Data-Focused)",
        description:
          "A precise, structured template for documenting laboratory experiments, procedures, and data analysis in technical courses.",
        type: "lab-report",
        tags: ["academic", "science", "technical", "experiment", "student"],
        is_public: true,
        content: [
          {
            type: "cover-page",
            attrs: { style: "technical-modular" },
            content: [
              {
                type: "paragraph",
                attrs: { style: "metadata-header" },
                content: [
                  {
                    type: "text",
                    text: "Course: [Course Code] | Group: [Collaborator Names]",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 1, color: "deep-blue", font: "Courier New" },
                content: [
                  { type: "text", text: "LAB REPORT: [Experiment Title]" },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Submission Date: [Date] | Performed By: [Your Name]",
                  },
                ],
              },
              { type: "visual-element", element: "Deep Blue Separator Bar" },
            ],
          },

          // --- Front Matter ---
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Front Matter" }],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Title Page ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Title Page" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Contains the paper's title, the author's name(s), institutional affiliation, course name, instructor, and submission date. Specifics vary by citation style.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Table of Contents ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Table of Contents" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "For longer documents like theses or dissertations, this section lists all headings and subheadings with corresponding page numbers, providing an overview of the paper's structure.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- List of Figures/Tables ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "List of Figures/Tables",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[List of visual elements, if applicable]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Abstract or Executive Summary ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "Abstract or Executive Summary",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Your abstract or executive summary]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Keywords ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Keywords" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A list of typically 3-7 specific terms included immediately after the abstract to help researchers and databases find your paper.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Main Body ---
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Main Body" }],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Introduction ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Introduction" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Hook & Background: Start broad, gradually introducing the topic and context.]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Thesis Statement: [The final sentence should state your central argument clearly. Use the **AI Thesis Checker** for strength and clarity.]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Literature Review ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Literature Review" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Review of relevant scholarly sources that establish the context for your research and demonstrate your familiarity with the field.]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Main Content Sections ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Main Content Sections" }],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Methods ---
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Methods" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Describes exactly how the study was conducted, including the research design, participants, data collection procedures, and analytical approach.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Results ---
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Results" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Presents the findings of the study objectively, often using text supported by tables and figures.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Discussion ---
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Discussion" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Interprets the results, discusses their implications, compares findings to the literature review, addresses limitations, and suggests future research directions.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Conclusion and Recommendations ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Conclusion and Recommendations" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Ties the entire paper together, restates the main findings in a concise manner, emphasizes the significance of the research, and may offer specific recommendations for policy or practice.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Back Matter ---
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Back Matter" }],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- References/Works Cited/Bibliography ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "References/Works Cited/Bibliography",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A consistently formatted list of all sources cited within the paper. The title and format depend entirely on the required style guide (e.g., APA, MLA, Chicago).",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Appendices ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Appendices" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Supplementary materials that support the argument but are too bulky to include in the main text, such as raw data tables, copies of surveys, questionnaires, or detailed protocols.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Acknowledgements ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Acknowledgements" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A section where authors thank individuals, institutions, or funding bodies that contributed to the research or writing process.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Glossary ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Glossary" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "An alphabetical list of specialized terms and their definitions used in the document, particularly helpful for complex or technical subjects.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Index ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Index" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "An alphabetized list of key terms, names, and topics with corresponding page numbers for easy reference, typically found in books and longer works.",
              },
            ],
          },
        ],
      },
      {
        name: "Annotated Bibliography (Dual-Style Analysis)",
        description:
          "A visually structured template for summarizing, analyzing, and assessing research sources, with automatic citation formatting and AI assistance.",
        type: "annotated-bibliography",
        tags: ["research", "academic", "citation", "analysis", "student"],
        is_public: true,
        content: [
          {
            type: "heading",
            attrs: { level: 1, color: "deep-blue", font: "Lato-Bold" },
            content: [
              {
                type: "text",
                text: "Annotated Bibliography: [Research Topic]",
              },
            ],
          },
          {
            type: "paragraph",
            attrs: { style: "metadata-header" },
            content: [
              {
                type: "text",
                text: "Citation Style: [APA 7th Edition] | Course: [Course Code]",
              },
            ],
          },
          {
            type: "visual-element",
            element: "Deep Blue Separator Bar",
          },

          // --- ENTRY 1 ---
          {
            type: "citation-block",
            attrs: { style: "hanging-indent", font: "Garamond" },
            content: [
              {
                type: "text",
                text: "Anderson, M. (2024). Unifying Fragmented Workflows in Academic Research: An AI-First Approach. Journal of Educational Technology, 15(3), 101-115.",
              },
            ],
          },
          {
            type: "annotation-block",
            attrs: { style: "light-teal-background", font: "Lato" },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "[Critical Summary: Summarize the source's main argument and findings in 3-5 sentences.]",
                  },
                ],
              },
              {
                type: "paragraph",
                attrs: { color: "dark-grey", style: "analysis-prompt" },
                content: [
                  {
                    type: "text",
                    text: "Evaluation: [How does this source support or contradict your thesis? Assess its credibility.]",
                  },
                ],
              },
              {
                type: "ai-tag",
                content: [
                  {
                    type: "text",
                    text: "AI Keywords: Workflow, Fragmentation, EdTech, AI Adoption",
                  },
                ],
              },
            ],
          },

          // --- ENTRY 2 ---
          {
            type: "citation-block",
            attrs: { style: "hanging-indent", font: "Garamond" },
            content: [
              {
                type: "text",
                text: "Gomez, L. (2023). The Ethics of AI in Student-Researcher Partnerships (Online Article). Ethics Today.",
              },
            ],
          },
          {
            type: "annotation-block",
            attrs: { style: "light-teal-background", font: "Lato" },
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "[Critical Summary: Summarize the source's main argument and findings.]",
                  },
                ],
              },
              {
                type: "paragraph",
                attrs: { color: "dark-grey", style: "analysis-prompt" },
                content: [
                  {
                    type: "text",
                    text: "Evaluation: [Assess the author's bias or potential limitations of this source.]",
                  },
                ],
              },
              {
                type: "ai-tag",
                content: [
                  {
                    type: "text",
                    text: "AI Keywords: Ethics, Data Privacy, Compliance, FERPA/GDPR",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Argumentative Essay (Five-Paragraph Structure)",
        description:
          "A minimalist, distraction-free template for writing standard argumentative essays. Includes prompts for thesis development, topic sentences, and evidence integration.",
        type: "essay",
        tags: ["academic", "student", "essay", "argumentative", "beginner"],
        is_public: true,
        content: [
          {
            type: "cover-page",
            attrs: { style: "minimalist-academic" },
            content: [
              {
                type: "paragraph",
                attrs: { style: "metadata-header" },
                content: [
                  {
                    type: "text",
                    text: "Student Name: [Your Name] | Course: [Course Code] | Date: [Date]",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 1, color: "black", font: "Lato-Bold" },
                content: [
                  { type: "text", text: "THE ARGUMENTATIVE ESSAY TITLE" },
                ],
              },
              { type: "visual-element", element: "Thin Black Rule Divider" },
            ],
          },

          // --- Front Matter ---
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Front Matter" }],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Title Page ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Title Page" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Contains the paper's title, the author's name(s), institutional affiliation, course name, instructor, and submission date. Specifics vary by citation style.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Table of Contents ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Table of Contents" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "For longer documents like theses or dissertations, this section lists all headings and subheadings with corresponding page numbers, providing an overview of the paper's structure.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- List of Figures/Tables ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "List of Figures/Tables",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[List of visual elements, if applicable]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Abstract or Executive Summary ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "Abstract or Executive Summary",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Your abstract or executive summary]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Keywords ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Keywords" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A list of typically 3-7 specific terms included immediately after the abstract to help researchers and databases find your paper.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Main Body ---
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Main Body" }],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Introduction ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Introduction" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Hook & Background: Start broad, gradually introducing the topic and context.]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Thesis Statement: [The final sentence should state your central argument clearly. Use the **AI Thesis Checker** for strength and clarity.]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Literature Review ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Literature Review" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Review of relevant scholarly sources that establish the context for your research and demonstrate your familiarity with the field.]",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Main Content Sections ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Main Content Sections" }],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Methods ---
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Methods" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Describes exactly how the study was conducted, including the research design, participants, data collection procedures, and analytical approach.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Results ---
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Results" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Presents the findings of the study objectively, often using text supported by tables and figures.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Discussion ---
          {
            type: "heading",
            attrs: { level: 3 },
            content: [{ type: "text", text: "Discussion" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Interprets the results, discusses their implications, compares findings to the literature review, addresses limitations, and suggests future research directions.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Conclusion and Recommendations ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Conclusion and Recommendations" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Ties the entire paper together, restates the main findings in a concise manner, emphasizes the significance of the research, and may offer specific recommendations for policy or practice.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Back Matter ---
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Back Matter" }],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- References/Works Cited/Bibliography ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [
              {
                type: "text",
                text: "References/Works Cited/Bibliography",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A consistently formatted list of all sources cited within the paper. The title and format depend entirely on the required style guide (e.g., APA, MLA, Chicago).",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Appendices ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Appendices" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Supplementary materials that support the argument but are too bulky to include in the main text, such as raw data tables, copies of surveys, questionnaires, or detailed protocols.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Acknowledgements ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Acknowledgements" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "A section where authors thank individuals, institutions, or funding bodies that contributed to the research or writing process.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Glossary ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Glossary" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "An alphabetical list of specialized terms and their definitions used in the document, particularly helpful for complex or technical subjects.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [],
          },
          {
            type: "paragraph",
            content: [],
          },

          // --- Index ---
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Index" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "An alphabetized list of key terms, names, and topics with corresponding page numbers for easy reference, typically found in books and longer works.",
              },
            ],
          },
        ],
      },
      {
        name: "IEEE Conference Paper/Journal Article",
        description:
          "A rigorously formatted template for technical papers, using the standard two-column layout, abstract, keywords block, and numerical reference style required by IEEE.",
        type: "conference-paper",
        tags: [
          "technical",
          "engineering",
          "cs",
          "ieee",
          "conference",
          "journal",
        ],
        is_public: true,
        content: [
          // --- Front Matter/Header (Full Width Section) ---
          {
            type: "heading",
            attrs: {
              level: 1,
              color: "deep-blue",
              font: "Times New Roman-Bold",
              size: "24pt",
              style: "centered-column-span",
            },
            content: [
              {
                type: "text",
                text: "Paper Title: Impact of AI-Driven Workflows on Academic Productivity",
              },
            ],
          },
          {
            type: "author-block",
            attrs: { style: "multi-column-ieee" },
            content: [
              {
                type: "author",
                name: "[Author 1 Name]",
                email: "[Email]",
                affiliation: "[Dept., Univ., City, Country]",
              },
              {
                type: "author",
                name: "[Author 2 Name]",
                email: "[Email]",
                affiliation: "[Dept., Univ., City, Country]",
              },
            ],
          },
          {
            type: "section",
            title: "Abstract",
            attrs: {
              style: "full-width-box-ieee",
              font: "Times New Roman-Italic",
            },
            content: [
              {
                type: "text",
                text: "This concise, 150-250 word summary must be a complete overview of the paper, covering the problem, methodology, results, and conclusion. [AI Assist: Check word count and ensure structural compliance for submission.]",
              },
            ],
          },
          {
            type: "keywords",
            attrs: { style: "full-width-line" },
            content: [
              {
                type: "text",
                text: "Index Terms—AI, Collaboration, EdTech, Workflow, Project Management, Code Generation.",
              },
            ],
          },

          // --- Main Body (Two Columns) ---
          {
            type: "heading",
            attrs: { level: 2, number: "I.", color: "deep-blue" },
            content: [{ type: "text", text: "Introduction" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The introduction provides context and states the contribution. All in-text references are numbered and enclosed in square brackets [1], [2]. The **CollaborateWise Citation Manager** automatically formats references to the IEEE standard.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "II.", color: "deep-blue" },
            content: [{ type: "text", text: "Proposed System Architecture" }],
          },
          {
            type: "heading",
            attrs: { level: 3, number: "A.", color: "deep-blue" },
            content: [{ type: "text", text: "Data Flow Diagram" }],
          },
          {
            type: "code-block",
            attrs: {
              style: "monospaced-ieee",
              language: "python",
              "border-color": "bright-green",
            },
            content: [
              {
                type: "text",
                text: "# Code or algorithm block here. Use monospaced font.",
              },
            ],
          },
          {
            type: "figure",
            attrs: { style: "centered-figure-ieee", span: "full-column" },
            content: [
              {
                type: "caption",
                text: "Fig. 1. Architectural diagram of the CollaborateWise AI system.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "VI.", color: "deep-blue" },
            content: [{ type: "text", text: "References" }],
          },
          {
            type: "list",
            attrs: { listType: "numbered", style: "ieee-citations" },
            content: [
              {
                type: "list-item",
                content: [
                  {
                    type: "text",
                    text: "[1] J. K. Author, “Title of paper,” Title of Journal, vol. x, no. x, pp. xxx–xxx, Month, Year.",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Premium Project Presentation Deck (10 Slide Set)",
        description:
          "A high-impact, minimalist presentation template designed for academic defenses, project pitches, or final report summaries, emphasizing visuals and key takeaways.",
        type: "presentation-deck",
        tags: [
          "pitch",
          "presentation",
          "visual",
          "premium",
          "student",
          "investor",
        ],
        is_public: true,
        content: [
          {
            type: "presentation-deck",
            slides: [
              // --- SLIDE 1: Title Slide ---
              {
                name: "Title Slide (Impact Header)",
                attrs: { background: "deep-blue", "text-color": "white" },
                content: [
                  {
                    type: "heading",
                    attrs: {
                      level: 1,
                      size: "48pt",
                      style: "left-aligned-bold",
                    },
                    content: [
                      {
                        type: "text",
                        text: "PROJECT TITLE: Addressing Fragmentation with AI",
                      },
                    ],
                  },
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Presenter: [Name] | Date: [Date]",
                      },
                    ],
                  },
                  {
                    type: "image-placeholder",
                    attrs: { style: "subtle-logo-corner" },
                  },
                ],
              },

              // --- SLIDE 2: Agenda/Overview Slide ---
              {
                name: "Agenda (Numbered List)",
                attrs: { background: "white", "text-color": "black" },
                content: [
                  {
                    type: "heading",
                    attrs: { level: 2, size: "36pt", color: "deep-blue" },
                    content: [
                      { type: "text", text: "01. Presentation Roadmap" },
                    ],
                  },
                  {
                    type: "list",
                    attrs: { listType: "ordered", color: "bright-green" },
                    content: [
                      {
                        type: "list-item",
                        content: [{ type: "text", text: "Problem & Thesis" }],
                      },
                      {
                        type: "list-item",
                        content: [
                          { type: "text", text: "Methodology / Architecture" },
                        ],
                      },
                      {
                        type: "list-item",
                        content: [{ type: "text", text: "Key Results (Data)" }],
                      },
                      {
                        type: "list-item",
                        content: [
                          { type: "text", text: "Conclusion & Next Steps" },
                        ],
                      },
                    ],
                  },
                ],
              },

              // --- SLIDE 3: Problem Statement Slide ---
              {
                name: "Quote/Problem Slide",
                attrs: { background: "light-grey", "text-color": "black" },
                content: [
                  {
                    type: "quote-box",
                    attrs: { color: "deep-blue" },
                    content: [
                      {
                        type: "text",
                        text: "The average researcher uses 4+ disconnected tools per project, wasting 15% of their time on task switching.",
                      },
                    ],
                  },
                  {
                    type: "paragraph",
                    attrs: { style: "source-cite" },
                    content: [
                      {
                        type: "text",
                        text: "Source: CollaborateWise Internal Research (2025)",
                      },
                    ],
                  },
                ],
              },

              // --- SLIDE 4: Data/Chart Slide ---
              {
                name: "Data Visualization Slide",
                attrs: { background: "white", "text-color": "black" },
                content: [
                  {
                    type: "heading",
                    attrs: { level: 2, color: "deep-blue" },
                    content: [
                      {
                        type: "text",
                        text: "Key Finding: Workflow Unification Slashes Project Time",
                      },
                    ],
                  },
                  {
                    type: "chart-placeholder",
                    attrs: {
                      "chart-type": "bar",
                      "color-scheme": "teal-accent",
                    },
                  },
                  {
                    type: "callout-text",
                    attrs: { color: "bright-green" },
                    content: [
                      {
                        type: "text",
                        text: "Result: 35% Reduction in Time Spent on Formatting/Citations.",
                      },
                    ],
                  },
                ],
              },

              // --- SLIDE 5: Thank You/Q&A Slide ---
              {
                name: "Q&A/Conclusion Slide",
                attrs: { background: "deep-blue", "text-color": "white" },
                content: [
                  {
                    type: "heading",
                    attrs: { level: 1, size: "60pt", style: "centered" },
                    content: [{ type: "text", text: "THANK YOU." }],
                  },
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "Questions? Visit CollaborateWise.com/AI",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Business/Design Case Study (Magazine Style)",
        description:
          "A visually engaging template for documenting business challenges, design processes (e.g., UX/UI), and quantifying project outcomes with key metrics.",
        type: "case-study",
        tags: ["business", "design", "ux", "marketing", "results", "premium"],
        is_public: true,
        content: [
          {
            type: "cover-page",
            attrs: { style: "magazine-hero" },
            content: [
              {
                type: "visual-element",
                element: "Hero Image Placeholder (Deep Blue Filter)",
              },
              {
                type: "heading",
                attrs: { level: 1, color: "white", font: "Poppins-Bold" },
                content: [
                  {
                    type: "text",
                    text: "CASE STUDY: Optimizing User Onboarding for EdTech Platforms",
                  },
                ],
              },
              {
                type: "paragraph",
                color: "white",
                content: [
                  {
                    type: "text",
                    text: "Project Lead: [Name] | Duration: [4 Weeks]",
                  },
                ],
              },
            ],
          },

          // --- Section 1: The Problem ---
          {
            type: "heading",
            attrs: { level: 2, number: "1.0", color: "deep-blue" },
            content: [
              { type: "text", text: "The Challenge: Defining the Pain Point" },
            ],
          },
          {
            type: "sidebar-block",
            attrs: { style: "light-blue-bg", label: "Key Insight" },
            content: [
              {
                type: "text",
                text: "Initial Onboarding Drop-off Rate: 45%. Primary cause: Cognitive Overload.",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Clearly articulate the business or user problem that needed to be solved. What was the starting metric? [AI Prompt: Use strong, active verbs to describe the challenge.]",
              },
            ],
          },

          // --- Section 2: The Process (Solution) ---
          {
            type: "heading",
            attrs: { level: 2, number: "2.0", color: "deep-blue" },
            content: [
              { type: "text", text: "The Process: Discovery and Design" },
            ],
          },
          {
            type: "list",
            attrs: { listType: "ordered", color: "bright-green" },
            content: [
              {
                type: "list-item",
                content: [
                  { type: "text", text: "Discovery: User Interviews (N=20)" },
                ],
              },
              {
                type: "list-item",
                content: [
                  { type: "text", text: "Design: Low-Fidelity Wireframes" },
                ],
              },
              {
                type: "list-item",
                content: [
                  { type: "text", text: "Testing: A/B Testing on Prototype" },
                ],
              },
            ],
          },
          {
            type: "image-placeholder",
            attrs: { style: "mid-section-design-mockup" },
            content: [
              {
                type: "caption",
                text: "Figure 1: Comparison of the original vs. streamlined onboarding flow.",
              },
            ],
          },

          // --- Section 3: The Result ---
          {
            type: "heading",
            attrs: { level: 2, number: "3.0", color: "deep-blue" },
            content: [
              { type: "text", text: "The Result: Quantifiable Success" },
            ],
          },
          {
            type: "callout-block",
            attrs: { style: "premium-gold-bg", color: "black" },
            content: [
              {
                type: "heading",
                attrs: { level: 3, color: "gold" },
                content: [{ type: "text", text: "+30% INCREASE" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "in successful user conversion rate post-redesign.",
                  },
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Conclude the study by discussing next steps and lessons learned. [AI Assist: Calculate the ROI based on conversion metrics.]",
              },
            ],
          },
        ],
      },
      {
        name: "Reflective Journal Entry (Gibbs Cycle Inspired)",
        description:
          "A personal and private template structured to guide users through the process of academic or personal reflection, turning an experience into a concrete action plan.",
        type: "journal-entry",
        tags: [
          "personal",
          "academic",
          "reflection",
          "student",
          "design-thinking",
        ],
        is_public: true,
        content: [
          {
            type: "heading",
            attrs: {
              level: 1,
              color: "deep-blue",
              font: "Lora-Bold",
              style: "journal-title",
            },
            content: [
              { type: "text", text: "Reflective Journal Entry: [Topic/Date]" },
            ],
          },
          {
            type: "paragraph",
            attrs: { style: "metadata-header" },
            content: [
              {
                type: "text",
                text: "Date: [Current Date] | Associated Project: [Thesis Chapter 3]",
              },
            ],
          },
          {
            type: "visual-element",
            element: "Earthy Toned Rule Divider",
          },

          // --- Part 1: Description (What Happened?) ---
          {
            type: "heading",
            attrs: { level: 2, number: "1.", color: "deep-blue" },
            content: [
              { type: "text", text: "The Situation: What Did I Experience?" },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Describe the event or situation factually. What happened? Who was involved? When and where? (Focus on being descriptive, not evaluative.)]",
              },
            ],
          },

          // --- Part 2: Analysis (So What?) ---
          {
            type: "heading",
            attrs: { level: 2, number: "2.", color: "deep-blue" },
            content: [
              {
                type: "text",
                text: "Evaluation & Analysis: So What Did I Learn?",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[Evaluation: What was good and bad about the experience? Feelings: How did I feel? Analysis: Why did things happen that way? Link it to existing theory or knowledge.]",
              },
            ],
          },

          // --- Part 3: Action Plan (Now What?) ---
          {
            type: "heading",
            attrs: { level: 2, number: "3.", color: "deep-blue" },
            content: [
              {
                type: "text",
                text: "Conclusion & Action Plan: Now What Will I Do?",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Conclusion: [What conclusions can be drawn about the experience? What would I do differently next time?]",
              },
            ],
          },
          {
            type: "action-list",
            attrs: { style: "bright-green-tasks" },
            content: [
              {
                type: "list-item",
                content: [
                  {
                    type: "text",
                    text: "Task 1: [Specific, measurable action to take based on this reflection.]",
                  },
                ],
              },
              {
                type: "list-item",
                content: [
                  {
                    type: "text",
                    text: "Task 2: [Another specific step to apply the learning.]",
                  },
                ],
              },
            ],
          },
          {
            type: "ai-prompt",
            attrs: { style: "subtle-reminder" },
            content: [
              {
                type: "text",
                text: "AI Reminder: Check the action plan against your Project Dashboard tasks.",
              },
            ],
          },
        ],
      },
      {
        name: "Premium Research Proposal (Grant/Funding Focus)",
        description:
          "A rigorously formatted template for high-stakes grant applications, institutional funding requests, or advanced academic research proposals. Includes dedicated sections for budget and work plan.",
        type: "research-proposal",
        tags: [
          "research",
          "proposal",
          "funding",
          "premium",
          "institutional",
          "grant",
        ],
        is_public: true,
        content: [
          // --- Premium Cover Page ---
          {
            type: "cover-page",
            attrs: { style: "gold-academic-band", background: "white" },
            content: [
              { type: "visual-element", element: "Deep Blue Header Bar" },
              {
                type: "heading",
                attrs: {
                  level: 1,
                  color: "deep-blue",
                  font: "Montserrat-Bold",
                },
                content: [
                  {
                    type: "text",
                    text: "PROJECT TITLE: [Bold, Centered Title Here]",
                  },
                ],
              },
              { type: "visual-element", element: "Gold Accent Line Divider" },
              {
                type: "heading",
                attrs: { level: 3 },
                content: [
                  {
                    type: "text",
                    text: "Principal Investigator: [Researcher Name] \n Institution: [University/Research Lab Name]",
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Funding Request: [Amount] | Submission Date: [Date]",
                  },
                ],
              },
            ],
          },

          // --- Section 1: Executive Summary ---
          {
            type: "heading",
            attrs: {
              level: 2,
              number: "1.0",
              color: "deep-blue",
              style: "full-width",
            },
            content: [{ type: "text", text: "Executive Summary (The Hook)" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[AI Prompt: Generate a concise, 250-word summary of the project's goal, methodology, and expected impact. Focus on the novelty and funding requirement. This section determines the success of the application.]",
              },
            ],
          },

          // --- Section 2: Problem & Significance ---
          {
            type: "heading",
            attrs: { level: 2, number: "2.0", color: "deep-blue" },
            content: [
              { type: "text", text: "Problem Statement and Significance" },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Detail the specific, urgent research gap this project addresses. Use the integrated **AI Summarization** feature [cite: 31] to efficiently reference key background literature. All citations must be auto-formatted (APA/MLA/Chicago)[cite: 46].",
              },
            ],
          },

          // --- Section 3: Methodology & Work Plan ---
          {
            type: "heading",
            attrs: { level: 2, number: "3.0", color: "deep-blue" },
            content: [
              {
                type: "text",
                text: "Project Methodology and Detailed Work Plan",
              },
            ],
          },
          {
            type: "table",
            attrs: { style: "timeline-blue-header" },
            content: [
              {
                row: [
                  "Phase",
                  "Milestone & Deliverable",
                  "Timeline (Months)",
                  "Status (Dashboard Link)",
                ],
              },
              {
                row: [
                  "Phase 1",
                  "[e.g., Data Collection]",
                  "[Month 1-3]",
                  "[View Live Dashboard]",
                ],
              },
            ],
          },

          // --- Section 4: Budget and Justification ---
          {
            type: "heading",
            attrs: { level: 2, number: "4.0", color: "deep-blue" },
            content: [
              { type: "text", text: "Budget Request and Justification" },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Provide a clear breakdown of all costs. Ensure the justification ties each expenditure directly to a project goal.",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2, number: "5.0", color: "deep-blue" },
            content: [
              { type: "text", text: "Expected Outcomes and Dissemination" },
            ],
          },
        ],
      },
      {
        name: "Literature Review (Thematic Synthesis Focus)",
        description:
          "A comprehensive template for organizing, summarizing, and synthesizing existing academic literature, designed to clearly identify the research gap and justify a new study.",
        type: "literature-review",
        tags: ["research", "academic", "synthesis", "gap-analysis", "phd"],
        is_public: true,
        content: [
          {
            type: "heading",
            attrs: { level: 1, color: "deep-blue", font: "Sans-Serif-Bold" },
            content: [
              { type: "text", text: "CHAPTER 2: REVIEW OF RELATED LITERATURE" },
            ],
          },
          {
            type: "paragraph",
            attrs: { style: "chapter-intro" },
            content: [
              {
                type: "text",
                text: "This chapter systematically reviews key theoretical and empirical literature relevant to [Your Research Topic], identifying major themes, points of consensus, and critical gaps.",
              },
            ],
          },
          {
            type: "visual-element",
            element: "Deep Blue Separator Bar",
          },

          // --- Section 1: Introduction ---
          {
            type: "heading",
            attrs: { level: 2, number: "2.1", color: "deep-blue" },
            content: [{ type: "text", text: "Introduction and Scope" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "[AI Tip: Define the inclusion/exclusion criteria for the literature surveyed. State the organizational structure of this chapter.]",
              },
            ],
          },

          // --- Section 2: Thematic Review (e.g., 2.2) ---
          {
            type: "heading",
            attrs: { level: 2, number: "2.2", color: "deep-blue" },
            content: [
              {
                type: "text",
                text: "Theme 1: Conceptual Frameworks of Workflow Fragmentation",
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 3, number: "2.2.1" },
            content: [
              {
                type: "text",
                text: "Sub-Theme: The Impact of AI on Tool Adoption",
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Discuss and synthesize findings from 3-4 key studies (e.g., Smith, 2022; Jones, 2023). Use the **In-line Citation** feature to ensure accurate referencing.",
              },
            ],
          },

          // --- Section 3: Synthesis and Gap Analysis (The Crux) ---
          {
            type: "heading",
            attrs: { level: 2, number: "2.3", color: "deep-blue" },
            content: [
              {
                type: "text",
                text: "Synthesis and Identification of the Research Gap",
              },
            ],
          },
          {
            type: "callout-block",
            attrs: { style: "highlight-teal-gap-box" },
            content: [
              {
                type: "heading",
                attrs: { level: 3, color: "bright-green" },
                content: [
                  { type: "text", text: "The Synthesis: Unifying Threads" },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Synthesize the common findings and major debates identified in the previous thematic sections.",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 3, color: "deep-blue" },
                content: [{ type: "text", text: "The Research Gap" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Clearly state the gap in the literature that this current study will address. **This must directly link to your research questions.**",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Academic Thesis Chapter (Formal Submission)",
        description:
          "A rigorously formatted template for writing a Master's Thesis or Doctoral Dissertation, adhering to strict academic standards for structure, numbering, and citation.",
        type: "thesis",
        tags: ["thesis", "dissertation", "academic", "graduate", "research"],
        is_public: true,
        content: [
          // --- Chapter Header ---
          {
            type: "heading",
            attrs: {
              level: 1,
              color: "deep-blue",
              font: "Times New Roman-Bold",
              style: "centered-chapter",
            },
            content: [{ type: "text", text: "CHAPTER 3: METHODOLOGY" }],
          },
          {
            type: "paragraph",
            attrs: { style: "chapter-opener-indent" },
            content: [
              {
                type: "text",
                text: "This chapter outlines the research design, data collection instruments, and analytical approach utilized to address the central research questions. The design is a [Qualitative/Quantitative/Mixed-Methods] approach...",
              },
            ],
          },

          // --- Section 1 ---
          {
            type: "heading",
            attrs: { level: 2, number: "3.1", color: "deep-blue" },
            content: [{ type: "text", text: "Research Design" }],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "The study employs a [Specific Design] framework to investigate [Topic]. Justification for this choice is based on the ability of this design to [Specific Reason].",
              },
            ],
          },

          // --- Section 2 ---
          {
            type: "heading",
            attrs: { level: 2, number: "3.2", color: "deep-blue" },
            content: [{ type: "text", text: "Data Collection and Sampling" }],
          },
          {
            type: "table",
            attrs: { style: "plain-academic" },
            content: [
              { row: ["Variable", "Measurement Tool", "Data Source"] },
              { row: ["[AI Metrics]", "[AI Tool]", "[AI Source]"] },
            ],
          },

          // --- Section 3 ---
          {
            type: "heading",
            attrs: { level: 2, number: "3.3", color: "deep-blue" },
            content: [{ type: "text", text: "Ethical Considerations" }],
          },
        ],
      },
      {
        name: "Professional Business Proposal (Solution-Focused)",
        description:
          "A visually compelling template for pitching services, products, or projects to commercial clients. Focuses on articulating the problem, detailing the solution, and presenting a clear call-to-action.",
        type: "business-proposal",
        tags: ["business", "sales", "proposal", "professional", "client"],
        is_public: true,
        content: [
          // --- Cover Page (High Impact) ---
          {
            type: "cover-page",
            attrs: { style: "agency-blue-strip", background: "white" },
            content: [
              {
                type: "visual-element",
                element: "Deep Blue Vertical Bar (Left Margin)",
              },
              {
                type: "heading",
                attrs: { level: 1, color: "deep-blue", font: "Poppins-Bold" },
                content: [
                  { type: "text", text: "PROPOSAL: [Client Project Name]" },
                ],
              },
              {
                type: "heading",
                attrs: { level: 3, color: "dark-grey" },
                content: [
                  {
                    type: "text",
                    text: "Submitted to: [Client Contact] \n Submitted by: [Your Company Name]",
                  },
                ],
              },
              {
                type: "visual-element",
                element: "Bright Green Horizontal Rule Divider",
              },
            ],
          },

          // --- Section 1: Executive Summary (Problem & Solution at a Glance) ---
          {
            type: "heading",
            attrs: {
              level: 2,
              number: "1.0",
              color: "deep-blue",
              style: "full-width",
            },
            content: [
              { type: "text", text: "Executive Summary: The Opportunity" },
            ],
          },
          {
            type: "quote-block",
            attrs: { style: "client-pain-point" },
            content: [
              {
                type: "text",
                text: "Current State: [Identify the client's single biggest pain point and its cost/impact on their business.]",
              },
            ],
          },

          // --- Section 2: Proposed Solution & Deliverables ---
          {
            type: "heading",
            attrs: { level: 2, number: "2.0", color: "deep-blue" },
            content: [{ type: "text", text: "Our Proposed Solution & ROI" }],
          },
          {
            type: "list",
            attrs: { listType: "icon-list", color: "bright-green" },
            content: [
              {
                type: "list-item",
                content: [
                  {
                    type: "text",
                    text: "Deliverable 1: [Specific, measurable result]",
                  },
                ],
              },
              {
                type: "list-item",
                content: [
                  {
                    type: "text",
                    text: "Deliverable 2: [Specific, measurable result]",
                  },
                ],
              },
            ],
          },

          // --- Section 3: Pricing & Timeline ---
          {
            type: "heading",
            attrs: { level: 2, number: "3.0", color: "deep-blue" },
            content: [
              { type: "text", text: "Investment and Project Timeline" },
            ],
          },
          {
            type: "pricing-table",
            attrs: { style: "three-column-focus" },
            content: [
              { row: ["Service Tier", "Total Cost", "Timeline"] },
              { row: ["Essential Plan", "$X,XXX", "4 Weeks"] },
            ],
          },

          // --- Section 4: Call to Action ---
          {
            type: "callout-block",
            attrs: { style: "full-width-teal-bg" },
            content: [
              {
                type: "heading",
                attrs: { level: 3, color: "white" },
                content: [
                  { type: "text", text: "Ready to Start? Next Steps." },
                ],
              },
              {
                type: "paragraph",
                color: "white",
                content: [
                  {
                    type: "text",
                    text: "Sign and return this proposal by [Date] to initiate the project and secure your start date.",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    // Check for existing templates to avoid duplicates
    const existingTemplates = await prisma.documentTemplate.findMany({
      where: {
        name: {
          in: templates.map((t) => t.name),
        },
      },
    });

    const existingTemplateNames = new Set(
      existingTemplates.map((t: any) => t.name)
    );

    // Insert only templates that don't already exist
    for (const template of templates) {
      if (!existingTemplateNames.has(template.name)) {
        await prisma.documentTemplate.create({
          data: template,
        });
        console.log(`Created template: ${template.name}`);
      } else {
        console.log(`Template already exists, skipping: ${template.name}`);
      }
    }

    console.log("Templates seeded successfully!");
  } catch (error) {
    console.error("Error seeding templates:", error);
  }
}

seedTemplates();
