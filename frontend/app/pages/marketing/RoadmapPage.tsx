"use client";

import { CheckCircle2, Circle, Star, Zap } from "lucide-react";
import Layout from "../../components/Layout";

interface RoadmapItem {
  version?: string;
  date: string;
  status: "completed" | "in-progress" | "planned";
  type: "new" | "improvement" | "fix";
  title: string;
  description: string;
  items: string[];
}

const roadmapData: RoadmapItem[] = [
  {
    date: "Q2 2026",
    status: "planned",
    type: "new",
    title: "Real-time AI Intelligence",
    description:
      "Deep integration of RAG systems for real-time context extraction and smart document analysis.",
    items: [
      "Backend Extraction Service (OpenAI/Gemini)",
      "Context-aware RAG Chat",
      "Dynamic Prompt Templates",
    ],
  },
  {
    date: "Q1 2026",
    status: "in-progress",
    type: "improvement",
    title: "Advanced Collaboration Suite",
    description:
      "Bringing real-time multiplayer capabilities to the workspace for seamless team collaboration.",
    items: [
      "Real-time cursor tracking",
      "Comment threads on any document",
      "Team workspaces & Permissions",
    ],
  },
  {
    version: "v1.4.0",
    date: "Jan 25, 2026",
    status: "completed",
    type: "new",
    title: "Discovery & Productivity Update",
    description:
      "Major release focusing on discovery workflows and competitive productivity features.",
    items: [
      "Search Alerts Panel with daily/weekly monitoring",
      "Research Panel with trending topics and search",
      "Concept Map Visualization Frame",
    ],
  },
  {
    version: "v1.3.0",
    date: "Jan 24, 2026",
    status: "completed",
    type: "improvement",
    title: "Asset Linking Overhaul",
    description:
      "Refactoring how you link and manage external assets — from modals to persistent sidebars for better productivity flow.",
    items: [
      "Persistent Asset Links Panel",
      "Search & Manual Link Forms",
      "Unified Add/Manage Workflow",
    ],
  },
  {
    version: "v1.2.0",
    date: "Jan 22, 2026",
    status: "completed",
    type: "new",
    title: "Verification & Analysis",
    description:
      "Introducing powerful cross-checking and analysis tools for accuracy and reliability.",
    items: [
      "Multi-Model Verification Panel (Gemini vs OpenRouter)",
      "Gap Analysis for Missing Perspectives",
      "Multi-language Translation",
    ],
  },
];

function RoadmapTimelineItem({
  item,
  isLast,
}: {
  item: RoadmapItem;
  isLast: boolean;
}) {
  const getIcon = () => {
    switch (item.status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-white" />;
      case "in-progress":
        return <Zap className="h-5 w-5 text-white" />;
      case "planned":
        return <Circle className="h-5 w-5 text-gray-400" />;
      default:
        return <Star className="h-5 w-5 text-white" />;
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case "completed":
        return "bg-blue-600 border-blue-600";
      case "in-progress":
        return "bg-amber-500 border-amber-500";
      case "planned":
        return "bg-white border-dashed border-gray-300";
      default:
        return "bg-gray-200";
    }
  };

  const getBadgeColor = () => {
    switch (item.type) {
      case "new":
        return "bg-blue-100 text-blue-700";
      case "improvement":
        return "bg-green-100 text-green-700";
      case "fix":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="relative flex gap-8">
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-blue-100" />
      )}

      {/* Icon Marker */}
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${getStatusColor()}`}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="pb-16 flex-1">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {item.version && (
            <span className="font-mono text-sm font-bold text-gray-900">
              {item.version}
            </span>
          )}
          <span className="text-sm text-gray-500">{item.date}</span>
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${getBadgeColor()}`}
          >
            {item.type.replace("-", " ")}
          </span>
          {item.status === "in-progress" && (
            <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              In Progress
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
        <p className="text-gray-600 mb-4 leading-relaxed max-w-2xl">
          {item.description}
        </p>

        <ul className="space-y-2">
          {item.items.map((feature, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {/* Header */}
        <header className="py-20 bg-gradient-to-b from-blue-50/50 to-white border-b border-gray-100">
          <div className="container mx-auto max-w-4xl px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Platform Roadmap
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              A detailed timeline of our continuous improvements and new
              features. We are building the future of context-aware
              productivity.
            </p>
          </div>
        </header>

        {/* Timeline Section */}
        <main className="container mx-auto max-w-4xl px-6 py-20">
          <div className="relative">
            {roadmapData.map((item, index) => (
              <RoadmapTimelineItem
                key={index}
                item={item}
                isLast={index === roadmapData.length - 1}
              />
            ))}
          </div>
        </main>
      </div>
    </Layout>
  );
}
