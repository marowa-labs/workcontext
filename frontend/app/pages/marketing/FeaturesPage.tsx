"use client";

import {
  Bot,
  Search,
  Layers,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  Brain,
  PenTool,
  Download,
  SpellCheck,
  Shield,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { Container } from "../../components/ui/container";
import { useInView } from "react-intersection-observer";
import { Feature3DScene } from "../../components/FeaturesPresentationFlow3D";

interface FeatureDetailProps {
  icon: LucideIcon;
  title: string;
  description: string;
  benefits: string[];
  imageUrl: string;
  reverse?: boolean;
  color: string;
  accent: string;
}

const featureVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

function FeatureDetail3D({
  icon: Icon,
  title,
  description,
  benefits,
  imageUrl,
  reverse = false,
  color,
  accent,
}: FeatureDetailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.15, triggerOnce: true });

  return (
    <motion.div
      ref={ref}
      variants={featureVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isHovered
            ? `linear-gradient(135deg, ${accent}26, transparent 60%)`
            : "transparent",
        }}
        transition={{ duration: 0.4 }}
      />

      {/* Glow orb that follows hover */}
      <motion.div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        animate={{
          opacity: isHovered ? 0.5 : 0.15,
          scale: isHovered ? 1.3 : 1,
        }}
        transition={{ duration: 0.5 }}
        style={{ background: accent }}
      />

      <div className="relative p-6 md:p-8">
        {/* Icon with 3D tilt on hover */}
        <motion.div
          animate={{ rotateY: isHovered ? 360 : 0, scale: isHovered ? 1.1 : 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${color} mb-6 shadow-lg`}
        >
          <Icon className="h-7 w-7 text-white" />
        </motion.div>

        <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>

        <p className="text-gray-400 mb-6 leading-relaxed transition-colors duration-300 group-hover:text-gray-300">
          {description}
        </p>

        {/* Benefits with staggered reveal */}
        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -12 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.15 + index * 0.08, duration: 0.4 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300 text-sm">{benefit}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Image with parallax zoom on hover */}
      <div className="relative h-48 overflow-hidden">
        <motion.img
          src={imageUrl}
          alt={title}
          animate={{ scale: isHovered ? 1.12 : 1, y: isHovered ? -6 : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>
    </motion.div>
  );
}

// Enhanced CTA Section with motion
function CTASection() {
  const router = useRouter();

  return (
    <section className="section-padding bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
      <Container>
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join teams already using WorkContext to connect their tools, docs,
              and conversations.
            </p>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6"
                onClick={() => router.push("/signup")}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

// Enhanced Intro Hero with 3D elements
function IntroHero3D() {
  const router = useRouter();
  const heroFeatures = [
    {
      icon: Bot,
      title: "AI Chat with External Context",
      color: "#a855f7",
      description:
        "Chat with AI that searches across your connected tools alongside your workspace.",
    },
    {
      icon: Layers,
      title: "Dual-Mode Editor",
      color: "#3b82f6",
      description:
        "Switch between TipTap rich-text and BlockNote block-based editing in the same document.",
    },
    {
      icon: Search,
      title: "Global Search Across 8 Sources",
      color: "#10b981",
      description:
        "Search workspaces, projects, tasks, members, chats, docs, and connected tools in parallel.",
    },
    {
      icon: MessageSquare,
      title: "@ Mentions for People & Tools",
      color: "#06b6d4",
      description:
        "Mention teammates, pages, tasks, or connected tools anywhere in your documents.",
    },
    {
      icon: Brain,
      title: "Memory Layer",
      color: "#f59e0b",
      description:
        "Track decisions, view activity timelines, and generate AI summaries in one place.",
    },
    {
      icon: PenTool,
      title: "Smart Task Management",
      color: "#22c55e",
      description:
        "Organize work with tasks, subtasks, priorities, and due dates. Extract tasks from documents.",
    },
  ];

  return (
    <section className="relative min-h-[70vh] bg-[#0a0a0a] overflow-hidden flex items-center">
      {/* Ambient gradient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[120px]" />

      <Container className="relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: headline */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-gray-300 mb-6"
            >
              <Sparkles className="h-4 w-4 text-purple-400" />
              Real features, built for real work
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Everything your team needs,{" "}
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                in one connected workspace
              </span>
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-lg">
              AI chat with external context, a dual-mode editor, global search
              across 8 sources, and deep integrations — all working together.
            </p>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6"
                onClick={() => router.push("/signup")}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: interactive 3D scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Feature3DScene features={heroFeatures} height={420} />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

// Features Grid with all 12 features
function FeaturesGrid() {
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
      accent: "#a855f7",
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
      accent: "#3b82f6",
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
      accent: "#10b981",
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
      accent: "#06b6d4",
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
      accent: "#f59e0b",
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
      accent: "#22c55e",
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
      accent: "#6366f1",
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
      accent: "#f43f5e",
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
      accent: "#64748b",
    },
  ];

  return (
    <section id="features" className="section-padding bg-[#0a0a0a]">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Real Features, Built for Real Work
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Every feature is implemented and working. Here's what you actually
            get.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureDetail3D key={index} {...feature} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export default function FeaturesPage() {
  return (
    <Layout>
      <IntroHero3D />
      <FeaturesGrid />
      <CTASection />
    </Layout>
  );
}
