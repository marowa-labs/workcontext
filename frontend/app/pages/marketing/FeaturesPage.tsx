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
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Intro Hero Section
function IntroHero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop')",
        }}
      />

      {/* Productivity illustrations background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-gray-200xl">📋</div>
        <div className="absolute top-40 right-20 text-4xl">💡</div>
        <div className="absolute bottom-40 left-1/4 text-5xl">🚀</div>
        <div className="absolute bottom-20 right-10 text-3xl">⚡</div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Everything You Need for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Productive Work
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
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

// Feature Detail Component
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
      {/* Content */}
      <div className={reverse ? "lg:col-start-2" : ""}>
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${color} mb-6`}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {title}
        </h3>

        <p className="text-lg text-gray-200 mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-200">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Image */}
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

// Features Presentation Flow
function FeaturesPresentationFlow() {
  const features = [
    {
      icon: Bot,
      title: "AI Chat Assistant",
      description:
        "Get intelligent, context-aware help from our AI assistant. Ask questions, get suggestions, and let AI handle routine tasks while you focus on what matters.",
      benefits: [
        "Context-aware responses based on your workspace",
        "Multi-model support (Gemini, OpenAI, OpenRouter)",
        "BYOK encryption for API keys at rest",
        "Task creation and management via chat",
      ],
      imageUrl:
        "https://image2url.com/images/1766035339540-bbbba493-1dcb-4604-8f70-23c6a9a878a2.png?w=800&h=600&fit=crop",
      color: "from-purple-600 to-purple-800",
    },
    {
      icon: Search,
      title: "Smart Task Management",
      description:
        "Create, organize, and track tasks with priorities, assignees, due dates, and dependencies. Never miss a deadline again.",
      benefits: [
        "Task creation with priorities and due dates",
        "Assignees and team collaboration",
        "Subtasks with progress tracking",
        "Dependencies and blocking relationships",
      ],
      imageUrl:
        "https://image2url.com/images/1766041624051-57126843-7e86-487c-875c-682a621bbc6e.png?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
      reverse: true,
    },
    {
      icon: FileText,
      title: "Document Editing & Collaboration",
      description:
        "Edit documents in real-time with your team. See who's working where, leave comments, and track every change.",
      benefits: [
        "Real-time collaborative editing with presence indicators",
        "Threaded comments on any section",
        "Full version history with one-click restore",
        "Workspace & team management with role-based access",
      ],
      imageUrl:
        "https://image2url.com/images/1766035335298-270bb4d5-1753-46ef-b984-91b47e54df1f.png?w=800&h=600&fit=crop",
      color: "from-blue-600 to-blue-800",
    },
    {
      icon: Shield,
      title: "Time Tracking & Progress",
      description:
        "Track time spent on tasks, monitor progress, and see activity feeds. Stay on top of your team's productivity.",
      benefits: [
        "Time tracking with start/stop controls",
        "Progress monitoring with visual charts",
        "Activity feed for team updates",
        "Notifications for important events",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      color: "from-amber-600 to-amber-800",
      reverse: true,
    },
    {
      icon: Download,
      title: "Multi-Format Export",
      description:
        "Export your work to any format you need. From PDF to DOCX to LaTeX — your work, your way.",
      benefits: [
        "Export to PDF, DOCX, LaTeX, RTF, and TXT",
        "Custom formatting with templates",
        "Batch export for entire projects",
        "Version history and backup support",
      ],
      imageUrl:
        "https://image2url.com/images/1766041414714-d21fc2eb-7026-4d37-9bb7-2c564aed93ab.png?w=800&h=600&fit=crop",
      color: "from-emerald-600 to-emerald-800",
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
