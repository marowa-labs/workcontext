"use client";

import {
  Bot,
  Search,
  FileText,
  Shield,
  Download,
  Zap,
  PenTool,
  Users,
  Sparkles,
  SpellCheck,
  MessageSquare,
  Brain,
  Layers,
  Lock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

function IntroHero() {
  const router = useRouter();

  return (
    <section className="section-padding bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">
              Built for Teams
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Productive Work
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed max-w-2xl mx-auto">
            An AI-powered productivity workspace that connects your team's
            context. Real features, built for real work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6"
              onClick={() => router.push("/signup")}
            >
              Try It Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 font-semibold px-8 py-6"
              >
                Explore Features
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FeatureDetailProps {
  icon: React.ElementType;
  title: string;
  description: string;
  benefits: string[];
  imageUrl: string;
  reverse?: boolean;
  color: string;
}

function FeatureDetail({
  icon: Icon,
  title,
  description,
  benefits,
  imageUrl,
  reverse = false,
  color,
}: FeatureDetailProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}
    >
      <div className={reverse ? "lg:col-start-2" : ""}>
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${color} mb-6`}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {title}
        </h3>

        <p className="text-lg text-gray-400 mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={reverse ? "lg:col-start-1" : ""}>
        <div className="relative rounded-2xl overflow-hidden border border-white/10">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}

function FeaturesPresentationFlow() {
  const features = [
    {
      icon: Bot,
      title: "AI Chat with External Context",
      description:
        "Chat with AI that searches across your connected tools alongside your workspace. Get source-specific citations and generate cross-app documents like PRDs, status updates, and handoff docs.",
      benefits: [
        "4 AI modes: General, Research, Autocomplete, Synthesize",
        "Source citations with tool-specific badges (Slack, Jira, GitHub)",
        "Cross-app synthesis: generate PRDs, status updates, handoff docs",
        "External context: AI searches connected tools alongside internal data",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop",
      color: "from-purple-600 to-purple-800",
    },
    {
      icon: Layers,
      title: "Dual-Mode Editor",
      description:
        "Switch between TipTap rich-text and BlockNote block-based editing in the same document. Content format is auto-detected on import so Notion pages, Jira issues, and Slack messages land in the right editor.",
      benefits: [
        "TipTap editor: rich formatting, tables, code blocks, LaTeX equations",
        "BlockNote editor: Notion-like blocks with drag handles and slash commands",
        "Auto-detect content format on import (Notion → Blocks, Slack → Editor)",
        "Import from local files, connected tools, or templates",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&h=600&fit=crop",
      color: "from-blue-600 to-blue-800",
      reverse: true,
    },
    {
      icon: Search,
      title: "Global Search Across 8 Sources",
      description:
        "Search everything in one place. Our search modal queries workspaces, projects, tasks, members, chat sessions, messages, documents, and connected external tools — all in parallel.",
      benefits: [
        "8 parallel sources: workspaces, projects, tasks, members, chats, docs",
        "External tool search: Slack, Notion, Jira, GitHub, Figma",
        "Source badges and deep links to original sources",
        "Filter tabs to narrow results by source type",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",
      color: "from-emerald-600 to-emerald-800",
    },
    {
      icon: MessageSquare,
      title: "@ Mentions for People & Tools",
      description:
        "Mention teammates, pages, tasks, or connected tools anywhere in your documents. External tool mentions like @Slack:#channel or @Jira:PROJ-123 link directly to the original source.",
      benefits: [
        "5 entity types: People, Pages, Spaces, Tasks, Connected Tools",
        "External mentions: @Slack:#channel, @Jira:PROJ-123, @GitHub:org/repo",
        "Source badges with clickable links to original tools",
        "Mention picker with search and source filtering",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
      color: "from-cyan-600 to-cyan-800",
      reverse: true,
    },
    {
      icon: Brain,
      title: "Memory Layer",
      description:
        "Keep your team's knowledge organized with a dedicated memory system. Track decisions, view activity timelines, generate AI summaries, and analyze meeting transcripts — all in one place.",
      benefits: [
        "Decisions: track decisions, action items, blockers with status management",
        "Activity: timeline of all workspace and connected tool activity",
        "Summaries: AI-generated daily, weekly, and project summaries",
        "Transcripts: upload and AI-analyze meeting transcripts",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=600&fit=crop",
      color: "from-amber-600 to-amber-800",
    },
    {
      icon: PenTool,
      title: "Smart Task Management",
      description:
        "Organize your work with tasks, subtasks, priorities, and due dates. Extract tasks directly from your documents and track them with Kanban boards and timeline views.",
      benefits: [
        "Task creation with priorities, assignees, due dates, and labels",
        "AI task extraction from documents",
        "Kanban board and Gantt chart timeline views",
        "Subtasks with progress tracking and dependency relationships",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
      reverse: true,
    },
    {
      icon: Download,
      title: "Multi-Format Export",
      description:
        "Export your documents to any format. From academic PDFs to editable Word docs, LaTeX for scientific publishing, spreadsheets, and direct upload to cloud storage.",
      benefits: [
        "Export to PDF, DOCX, TXT, LaTeX, RTF, XLSX, CSV, and PNG",
        "Direct export to Google Drive and OneDrive",
        "Journal-ready templates: IEEE, Nature, Science, APA Journal",
        "Citation styles: APA, MLA, Chicago with pre-export auditing",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
    },
    {
      icon: SpellCheck,
      title: "Grammar & Language Checking",
      description:
        "Write with confidence using AI-powered grammar, spell, and style checking. Get real-time suggestions, rephrase options, and multiple alternative phrasings with confidence scores.",
      benefits: [
        "AI grammar checking with debounced backend analysis",
        "Spell checking via typo-js with suggestion popup",
        "AI rephrase: generate multiple alternatives with confidence scores",
        "Language and style checking with structured suggestions",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop",
      color: "from-rose-600 to-rose-800",
      reverse: true,
    },
    {
      icon: Shield,
      title: "Integrations & Security",
      description:
        "Connect your favorite tools with one-click OAuth. Manage roles and permissions with granular RBAC. All integrations support universal semantic search across connected tools.",
      benefits: [
        "One-click OAuth for 6 tools: Slack, Notion, Jira, GitHub, Figma, Google",
        "Universal semantic search across all connected tools",
        "RBAC: custom roles with granular resource-level permissions",
        "System role protection with audit trail",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop",
      color: "from-slate-600 to-slate-800",
    },
  ];

  return (
    <section id="features" className="section-padding bg-[#0a0a0a]">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Real Features, Built for Real Work
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Every feature is implemented and working. Here's what you actually
            get.
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <FeatureDetail key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const router = useRouter();

  return (
    <section className="section-padding bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
      <div className="container-custom relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            Join teams already using WorkContext to connect their tools, docs,
            and conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6"
              onClick={() => router.push("/signup")}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <Layout>
      <IntroHero />
      <FeaturesPresentationFlow />
      <CTASection />
    </Layout>
  );
}
