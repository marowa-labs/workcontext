"use client";

import {
  Bot,
  PenTool,
  SpellCheck,
  Lightbulb,
  CheckCircle,
  Sparkles,
  Search,
  Shield,
  ImageIcon,
  Sigma,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

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
            "url('https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop')",
        }}
      ></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Work Smarter with{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI-Powered Productivity
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Harness multiple AI models — Gemini 2.5 Flash, GPT OSS 120B, and
            Nvidia Nemotron — with Bring Your Own Key support. Write, research,
            generate images, check grammar, simulate peer review, and
            collaborate — all from one workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
              onClick={handleGetStarted}
            >
              Start Writing Smarter
            </Button>
            <Button
              size="lg"
              className="bg-white text-gray-600 border border-white hover:bg-white font-semibold px-8 py-6"
              asChild
            >
              <Link href="/features">Explore Features</Link>
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

        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {title}
        </h3>

        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full bg-gradient-to-br ${color} mt-2.5 flex-shrink-0`}
              ></div>
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
      title: "Multi-Model AI Chat Assistant",
      description:
        "Chat with an AI assistant that understands your writing context. Choose from multiple models including Gemini 2.5 Flash, GPT OSS 120B, and Nvidia Nemotron Super 120B. Use your own API keys with BYOK support for all models.",
      benefits: [
        "Multiple AI models: Gemini 2.5 Flash, GPT OSS 120B, Nvidia Nemotron",
        "Bring Your Own Key (BYOK) — all models accept your API keys",
        "Research co-pilot modes: general, research, and autocomplete",
        "Thumbs up/down feedback and full interaction history",
      ],
      imageUrl:
        "https://image2url.com/images/1766041152077-b4c17420-fe8e-4b9c-9c7c-dd9b7c022d9c.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
    },
    {
      icon: PenTool,
      title: "AI Writing Actions",
      description:
        "Transform your writing with a single click. Improve clarity, fix grammar, simplify complex text, expand on ideas, apply academic tone, paraphrase, or continue writing from where you left off — all powered by AI.",
      benefits: [
        "Improve Writing: enhance clarity and flow of any selection",
        "Fix Grammar: automatically correct grammar errors",
        "Simplify & Expand: adjust complexity level of your text",
        "Academic Tone & Paraphrase: rewrite to match your audience",
      ],
      imageUrl:
        "https://image2url.com/images/1766041153329-020b1a54-2b68-4606-b68b-7db5fda21e14.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
      reverse: true,
    },
    {
      icon: Search,
      title: "Research & Citation Tools",
      description:
        "Research topics, find relevant sources, generate properly formatted citations, compare arguments side-by-side, and check the defensibility of your claims — without leaving your document.",
      benefits: [
        "Research topics with AI-powered source suggestions",
        "Auto-generate citations in APA, MLA, and Chicago styles",
        "Compare arguments with side-by-side structural analysis",
        "Defensibility check: evaluate the strength of your claims",
      ],
      imageUrl:
        "https://image2url.com/images/1766041154551-efe0d071-68f1-4ded-be3a-fe39a16514fc.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
    },
    {
      icon: Sparkles,
      title: "AI Autocomplete & Cortex Functions",
      description:
        "Stay in the flow with inline AI text prediction. Ghost text appears as you type — press Tab to accept, Esc to dismiss. Cortex AI functions let you summarize, rewrite, extract key points, and generate equations instantly.",
      benefits: [
        "Inline autocomplete: ghost text predictions as you type",
        "Smart Summarize: condense any selection into key points",
        "Academic Rewrite: transform text into formal academic style",
        "AI Equation Generation: describe equations in plain English",
      ],
      imageUrl:
        "https://image2url.com/images/1766035312459-98d7648e-94de-43de-8e51-c1d98680ce12.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
      reverse: true,
    },
    {
      icon: SpellCheck,
      title: "Grammar & Language Checking",
      description:
        "Write with confidence. Real-time grammar checking, language/style analysis, spell checking, and AI-powered rephrase — all integrated into the editor with inline suggestions and correction popups.",
      benefits: [
        "AI grammar check: full-document analysis with structured feedback",
        "Language/style check: comprehensive writing improvement suggestions",
        "Real-time spell checking with click-to-correct suggestions",
        "Rephrase tool: multiple alternatives with confidence scores",
      ],
      imageUrl:
        "https://image2url.com/images/1766041414714-d21fc2eb-7026-4d37-9bb7-2c564aed93ab.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
    },
    {
      icon: Shield,
      title: "AI Peer Review & Image Tools",
      description:
        "Simulate a rigorous peer review before submitting your work. Generate images from text prompts, analyze uploaded images, and get AI-powered feedback on novelty, methodology, citations, and clarity.",
      benefits: [
        "Peer review simulation with categorized issues and severity scoring",
        "AI image generation from natural language descriptions",
        "Image analysis: analyze uploaded images with AI",
        "Overall verdict: accept, minor revisions, major revisions, or reject",
      ],
      imageUrl:
        "https://www.frontiersin.org/files/Articles/1596462/feduc-10-1596462-HTML/image_m/feduc-10-1596462-g001.jpg?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
      reverse: true,
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="space-y-24 text-gray-600">
          {features.map((feature, index) => (
            <FeatureDetail key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding relative overflow-hidden bg-[#121212]">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 opacity-95"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-indigo-500/30 rounded-full"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-indigo-500/30 rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-indigo-500/30 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 border-2 border-indigo-500/30 rotate-12"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Join thousands of individuals and teams who are already working
            smarter with AI chat, task management, real-time collaboration, and
            seamless export — all in one powerful workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
              onClick={handleGetStarted}
            >
              Start Your Free Trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-gray-600 hover:bg-white backdrop-blur-sm px-8 py-6 text-lg"
            >
              <Link href="/docs/quickstart" className="flex items-center">
                See How It Works
              </Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-600 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-400" />
              <span>Available worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AIWorkspacePage() {
  return (
    <Layout>
      <IntroHero />
      <FeaturesPresentationFlow />
      <ClosingCTA />
    </Layout>
  );
}
