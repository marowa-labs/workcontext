"use client";

import {
  Bot,
  PenTool,
  SpellCheck,
  CheckCircle,
  Sparkles,
  Search,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import AuraObject3DViolet from "../../components/AuraObject3DViolet";

// ─── Aura Design Tokens (Regal / Violet variant) ────────────────────────────
const ACCENT = "#a78bfa";
const ACCENT_GLOW = "rgba(167, 139, 250, 0.45)";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Reveal Variants ────────────────────────────────────────────────────────
const reveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE, delay: i * 0.12 },
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// Intro Hero — split layout with the violet crystal centerpiece
// ═══════════════════════════════════════════════════════════════════════════════
function IntroHero() {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#111111]"
    >
      {/* 3D centerpiece */}
      <div className="absolute inset-0 z-0">
        <AuraObject3DViolet />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(17,17,17,0.35)_0%,rgba(17,17,17,0.85)_70%,#111111_100%)]" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#111111]/60 via-transparent to-[#111111]" />

      <motion.div
        style={
          reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }
        }
        className="relative z-10 container-custom grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-24 lg:py-0"
      >
        {/* Left: copy */}
        <div className="text-left">
          <motion.p
            custom={0}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="text-xs uppercase tracking-[0.35em] text-[#a78bfa] mb-6"
          >
            AI Workspace
          </motion.p>

          <motion.h1
            custom={1}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f4f4f2] mb-6 leading-[1.05]"
          >
            Work Smarter with{" "}
            <span className="text-[#a78bfa]">AI-Powered Productivity</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="text-lg text-[rgba(244,244,242,0.55)] mb-8 leading-relaxed max-w-xl"
          >
            Harness multiple AI models — Gemini 2.5 Flash, GPT OSS 120B, and
            Nvidia Nemotron — with Bring Your Own Key support. Write, research,
            generate images, check grammar, simulate peer review, and
            collaborate — all from one workspace.
          </motion.p>

          <motion.div
            custom={3}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="rounded-none bg-[#a78bfa] text-[#0b0b0b] hover:bg-[#c4b5fd] font-semibold px-8 py-6 transition-all duration-300"
              onClick={handleGetStarted}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT_GLOW}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Start Writing Smarter
            </Button>
            <Button
              size="lg"
              className="rounded-none border border-[rgba(255,255,255,0.16)] text-[#f4f4f2] bg-white/[0.03] hover:bg-white/[0.08] font-semibold px-8 py-6"
              asChild
            >
              <Link href="/features">Explore Features</Link>
            </Button>
          </motion.div>
        </div>

        {/* Right: ghost outline title for depth */}
        <div className="hidden lg:block relative h-[420px]">
          <h1
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[7rem] font-bold text-transparent whitespace-nowrap select-none pointer-events-none"
            style={{ WebkitTextStroke: "1px rgba(167,139,250,0.14)" }}
          >
            AI
          </h1>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.35em] text-[rgba(244,244,242,0.32)]">
          Scroll
        </span>
        <div className="w-px h-12 bg-[rgba(255,255,255,0.08)] relative overflow-hidden">
          <motion.div
            animate={{ y: [-48, 48] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-transparent via-[#a78bfa] to-transparent"
          />
        </div>
      </motion.div>
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
}

function FeatureDetail({
  icon: Icon,
  title,
  description,
  benefits,
  imageUrl,
  reverse = false,
}: FeatureDetailProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}
    >
      <motion.div
        custom={0}
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className={reverse ? "lg:col-start-2" : ""}
      >
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-none border border-[rgba(255,255,255,0.08)] bg-[#171717] mb-6`}
        >
          <Icon className="h-8 w-8 text-[#a78bfa]" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-[#f4f4f2] mb-4">
          {title}
        </h3>

        <p className="text-lg text-[rgba(244,244,242,0.55)] mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#a78bfa] mt-2.5 flex-shrink-0"></div>
              <span className="text-[rgba(244,244,242,0.55)]">{benefit}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        custom={1}
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className={reverse ? "lg:col-start-1" : ""}
      >
        <div className="relative border border-[rgba(255,255,255,0.08)] bg-[#171717] p-2">
          <div className="h-px bg-gradient-to-r from-transparent via-[#a78bfa]/60 to-transparent absolute top-0 left-0 right-0"></div>
          <img src={imageUrl} alt={title} className="w-full" />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
        </div>
      </motion.div>
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
      reverse: true,
    },
  ];

  return (
    <section className="section-padding bg-[#0b0b0b] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#a78bfa]/[0.05] blur-3xl pointer-events-none" />

      <div className="container-custom relative">
        <motion.div
          custom={0}
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[#a78bfa] mb-4">
            Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-6">
            Everything Your Writing Needs
          </h2>
          <p className="text-lg text-[rgba(244,244,242,0.55)] leading-relaxed">
            Six deeply integrated AI capabilities — from multi-model chat to
            simulated peer review — working together inside one workspace.
          </p>
        </motion.div>

        <div className="space-y-24">
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
    <section className="section-padding relative overflow-hidden bg-[#111111]">
      {/* Glow blobs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#a78bfa]/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#a78bfa]/[0.04] blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        <motion.div
          custom={0}
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[#a78bfa] mb-4">
            Get Started
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-6">
            Ready to Boost Your Productivity?
          </h2>
          <p className="text-lg text-[rgba(244,244,242,0.55)] mb-8 leading-relaxed">
            Join thousands of individuals and teams who are already working
            smarter with AI chat, task management, real-time collaboration, and
            seamless export — all in one powerful workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="rounded-none bg-[#a78bfa] text-[#0b0b0b] hover:bg-[#c4b5fd] font-semibold px-8 py-6 transition-all duration-300"
              onClick={handleGetStarted}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT_GLOW}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Start Your Free Trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none border-[rgba(255,255,255,0.16)] text-[#f4f4f2] bg-white/[0.03] hover:bg-white/[0.08] px-8 py-6 text-lg"
            >
              <Link href="/docs/quickstart" className="flex items-center">
                See How It Works
              </Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-[rgba(244,244,242,0.55)] text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#a78bfa]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#a78bfa]" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#a78bfa]" />
              <span>Available worldwide</span>
            </div>
          </div>
        </motion.div>
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
