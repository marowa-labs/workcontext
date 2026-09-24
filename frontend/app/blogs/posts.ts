export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    author: string;
    date: string;
    readTime: string;
    category: string;
    imageUrl: string;
    slug: string;
}

export const blogPosts: BlogPost[] = [
    {
        id: "1",
        title: "Getting Started with WorkContext: A Complete Walkthrough",
        excerpt:
            "Learn how to set up your workspace, create your first document, invite team members, and start collaborating in real-time with our comprehensive getting started guide.",
        content: `
      <p class="mb-4">Welcome to WorkContext! Setting up your context-aware productivity workspace is designed to be intuitive and lightning-fast. In this guide, we'll walk you through everything you need to know to get your team up and running in minutes.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">1. Creating Your Workspace</h2>
      <p class="mb-4">Once you sign up, you will be prompted to create your organization workspace. Choose a clean name and invite your core team members via email or secure invite link. You can assign roles such as Admin, Editor, or Viewer.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">2. Connecting Your First Documents</h2>
      <p class="mb-4">WorkContext brings all your documents, tasks, and notes into a unified context graph. Use our block-based editor to create rich documents with images, code blocks, task lists, and real-time multiplayer cursors.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">3. Leveraging AI and Integrations</h2>
      <p class="mb-4">Connect your GitHub, Jira, Notion, and Figma integrations via the settings panel. Use the built-in multi-model AI assistant to summarize documents, generate task breakdowns, and answer questions across your entire workspace.</p>
    `,
        author: "WorkContext Team",
        date: "March 15, 2026",
        readTime: "8 min read",
        category: "Guides",
        imageUrl:
            "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=450&fit=crop",
        slug: "getting-started-with-workcontext",
    },
    {
        id: "2",
        title: "How to Use the AI Writing Assistant Effectively",
        excerpt:
            "Discover how to leverage WorkContext's multi-model AI assistant — from improving writing and fixing grammar to researching topics and generating citations automatically.",
        content: `
      <p class="mb-4">Artificial Intelligence has transformed how we write and organize knowledge. WorkContext's AI assistant is deeply integrated into your document flow, giving you context-aware suggestions without breaking your creative momentum.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">Context-Aware Generation</h2>
      <p class="mb-4">Unlike standalone chat windows, WorkContext's AI understands the entire document context and linked references in your workspace. When you ask it to expand a paragraph or summarize research notes, it pulls directly from verified project sources.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">Bring Your Own Key (BYOK)</h2>
      <p class="mb-4">You can connect your own API keys for Gemini, OpenAI, Anthropic, or Nvidia models to ensure complete data privacy, zero retention, and full cost control.</p>
    `,
        author: "WorkContext Team",
        date: "March 10, 2026",
        readTime: "10 min read",
        category: "AI & Productivity",
        imageUrl:
            "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=450&fit=crop",
        slug: "ai-writing-assistant-guide",
    },
    {
        id: "3",
        title: "Real-Time Collaboration: Tips for Remote Teams",
        excerpt:
            "Maximize your team's productivity with real-time collaborative editing, presence indicators, comments, and version history. Best practices for remote and hybrid teams.",
        content: `
      <p class="mb-4">Remote collaboration requires tools that feel as seamless as sitting in the same room. WorkContext provides sub-50ms real-time syncing, live presence cursors, inline comments, and robust version history.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">Presence and Cursors</h2>
      <p class="mb-4">See who is viewing and editing documents in real-time. Colored cursors and avatar indicators eliminate duplication of effort and keep everyone aligned.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">Version History & Recovery</h2>
      <p class="mb-4">Never lose work again. Every keystroke is saved and indexed, allowing you to roll back to any previous version or review contributions by team member.</p>
    `,
        author: "WorkContext Team",
        date: "March 5, 2026",
        readTime: "6 min read",
        category: "Collaboration",
        imageUrl:
            "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop",
        slug: "real-time-collaboration-tips",
    },
    {
        id: "4",
        title: "Exporting Your Work: From Document to Publication",
        excerpt:
            "A deep dive into WorkContext's export engine: PDF, DOCX, LaTeX, RTF, Google Drive, OneDrive, journal templates, and citation styles — everything you need to publish.",
        content: `
      <p class="mb-4">Writing is only half the battle; formatting and publishing take up valuable time. WorkContext features a professional export engine supporting PDF, DOCX, LaTeX, and academic journal templates.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">Academic & Professional Formats</h2>
      <p class="mb-4">Export your documents instantly formatted to IEEE, APA, Harvard, or custom corporate styling guidelines with automatically generated bibliographies and tables of contents.</p>
    `,
        author: "WorkContext Team",
        date: "February 28, 2026",
        readTime: "7 min read",
        category: "Features",
        imageUrl:
            "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=450&fit=crop",
        slug: "exporting-work-to-publication",
    },
    {
        id: "5",
        title: "Understanding BYOK: Bring Your Own AI Key in WorkContext",
        excerpt:
            "Learn how WorkContext's BYOK feature lets you use your own API keys for Gemini, OpenAI-compatible, and Nvidia models — keeping your data private and costs predictable.",
        content: `
      <p class="mb-4">Data privacy is paramount for modern engineering and research teams. With WorkContext's Bring Your Own Key (BYOK) architecture, your API keys are stored locally and encrypted securely.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">Zero Data Retention</h2>
      <p class="mb-4">Because requests go directly through your provider keys, your proprietary code and notes are never retained or used for model training by third parties.</p>
    `,
        author: "WorkContext Team",
        date: "February 20, 2026",
        readTime: "5 min read",
        category: "Security",
        imageUrl:
            "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=450&fit=crop",
        slug: "byok-bring-your-own-key",
    },
    {
        id: "6",
        title: "Task Management with Gantt Charts and Kanban Boards",
        excerpt:
            "Organize your projects with WorkContext's task management system — use Gantt charts for timeline planning, Kanban boards for workflow tracking, and dependencies for complex projects.",
        content: `
      <p class="mb-4">Projects stall when communication and task tracking live in separate tools. WorkContext unifies documentation with powerful Kanban boards and Gantt timeline charts.</p>
      
      <h2 class="text-2xl font-bold text-white mt-8 mb-4">Visualizing Timelines</h2>
      <p class="mb-4">Map out milestones, dependencies, and deadlines with interactive Gantt charts that update automatically as team members check off sub-tasks in documents.</p>
    `,
        author: "WorkContext Team",
        date: "February 15, 2026",
        readTime: "9 min read",
        category: "Productivity",
        imageUrl:
            "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=450&fit=crop",
        slug: "task-management-gantt-kanban",
    },
];
