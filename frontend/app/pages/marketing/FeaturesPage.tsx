"use client";

import {
  Bot,
  Search,
  FileText,
  Shield,
  Download,
  Lightbulb,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  PenTool,
  Users,
  Sparkles,
  SpellCheck,
  Sigma,
  Code,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
import { useState } from "react";

function IntroHero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop')",
        }}
      />
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-gray-600xl">📋</div>
        <div className="absolute top-40 right-20 text-4xl">💡</div>
        <div className="absolute bottom-40 left-1/4 text-5xl">🚀</div>
        <div className="absolute bottom-20 right-10 text-3xl">⚡</div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Productive Work
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Transform how you work with our integrated features that boost
            productivity, enhance collaboration, and streamline your workflow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 btn-glow"
              onClick={handleGetStarted}
            >
              Try It Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-6 btn-glow border border-white"
            >
              Explore All Features
            </Button>
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
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${color} mb-6`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {title}
        </h3>

        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-600">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={reverse ? "lg:col-start-1" : ""}>
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="rounded-2xl shadow-2xl w-full"
          />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-black/10 to-transparent"></div>
        </div>
      </div>
    </div>
  );
}

function FeaturesPresentationFlow() {
  const features = [
    {
      icon: Bot,
      title: "AI Writing & Research Copilot",
      description:
        "Write smarter with a multi-model AI assistant that can improve your writing, fix grammar, simplify complex text, research topics, generate citations, and more — all within your document.",
      benefits: [
        "Multi-model support: Gemini 2.5 Flash, GPT OSS 120B, Nvidia Nemotron",
        "Writing actions: improve, fix grammar, simplify, expand, academic tone, paraphrase, continue writing",
        "Research tools: topic research, source suggestions, citation generation (APA/MLA/Chicago)",
        "Bring Your Own Key (BYOK) — use your own API keys for any model",
      ],
      imageUrl:
        "https://image2url.com/images/1766035339540-bbbba493-1dcb-4604-8f70-23c6a9a878a2.png?w=800&h=600&fit=crop",
      color: "from-purple-600 to-purple-800",
    },
    {
      icon: Users,
      title: "Real-Time Collaborative Editor",
      description:
        "Edit documents simultaneously with your team using our TipTap-based editor powered by Yjs CRDT and Hocuspocus WebSocket technology. See who's working where and what they're changing — instantly.",
      benefits: [
        "Real-time co-editing with collaborative cursor presence indicators",
        "Rich formatting: headings, bold/italic/underline, tables, code blocks with syntax highlighting",
        "LaTeX equation editor with built-in equation library and AI equation generation",
        "Resizable images with alignment and text wrap, task lists, and document outline panel",
      ],
      imageUrl:
        "https://image2url.com/images/1766035335298-270bb4d5-1753-46ef-b984-91b47e54df1f.png?w=800&h=600&fit=crop",
      color: "from-blue-600 to-blue-800",
    },
    {
      icon: PenTool,
      title: "Smart Task Management",
      description:
        "Organize your work with tasks, subtasks, priorities, assignees, and due dates. Visualize progress with Kanban boards and Gantt charts. Track time and manage dependencies between tasks.",
      benefits: [
        "Task creation with priorities, assignees, due dates, and labels",
        "Subtasks with progress tracking and dependency relationships",
        "Kanban board and Gantt chart timeline views",
        "Time tracking with start/stop controls and activity feed",
      ],
      imageUrl:
        "https://image2url.com/images/1766041624051-57126843-7e86-487c-875c-682a621bbc6e.png?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
      reverse: true,
    },
    {
      icon: Download,
      title: "Advanced Multi-Format Export",
      description:
        "Export your documents to any format you need. From academic PDFs to editable Word docs, LaTeX for scientific publishing, spreadsheets, and cloud storage — your work, your way.",
      benefits: [
        "Export to PDF, DOCX, TXT, LaTeX, RTF, XLSX, CSV, and PNG",
        "Export directly to Google Drive and OneDrive cloud storage",
        "Journal-ready templates: IEEE, Nature, Science, APA Journal",
        "Citation styles: APA, MLA, Chicago — with pre-export document auditing",
      ],
      imageUrl:
        "https://image2url.com/images/1766041414714-d21fc2eb-7026-4d37-9bb7-2c564aed93ab.png?w=800&h=600&fit=crop",
      color: "from-emerald-600 to-emerald-800",
    },
    {
      icon: SpellCheck,
      title: "Grammar, Language & Spell Checking",
      description:
        "Write with confidence using AI-powered grammar and language checking. Get real-time suggestions, rephrase options, and spell check — all integrated directly into the editor.",
      benefits: [
        "AI grammar checking with debounced backend analysis",
        "Language/style checking with structured JSON suggestions",
        "Real-time spell checking via typo-js with suggestion popup",
        "AI rephrase: generate multiple alternatives with confidence scores",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      color: "from-amber-600 to-amber-800",
      reverse: true,
    },
    {
      icon: Sparkles,
      title: "AI Autocomplete & Cortex Functions",
      description:
        "Stay in flow with inline AI text prediction that suggests completions as you type. Use Cortex AI functions to instantly summarize, rewrite academically, extract key points, or generate equations.",
      benefits: [
        "Inline AI autocomplete with ghost text — Tab to accept, Esc to dismiss",
        "Smart Summarize: condense selected text into key points",
        "Academic Rewrite: transform casual writing into formal academic style",
        "AI Equation Generation: convert natural language descriptions into LaTeX",
      ],
      imageUrl:
        "https://image2url.com/images/1766035336823-26557e0e-2275-4c00-a32b-3ceaf5ded69e.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
    },
    {
      icon: Shield,
      title: "Peer Review & Research Analysis",
      description:
        "Strengthen your work with AI-powered peer review simulation, claim defensibility checks, argument comparison, and deep research analysis — before anyone else sees it.",
      benefits: [
        "AI peer review simulation: harsh critique with categorized issues and score",
        "Claim defensibility checking with structured analysis",
        "Deep web search with source analysis and citation extraction",
        "Research co-pilot modes: general, research, and autocomplete",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=800&fit=crop",
      color: "from-red-600 to-red-800",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="space-y-24">
          {features.map((feature, index) => (
            <FeatureDetail key={index} {...feature} />
          ))}
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
    </Layout>
  );
}
