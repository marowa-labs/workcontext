"use client";

import homeGif from "@/app/assets/home.gif";
import {
  PenTool,
  Shield,
  Users,
  Bot,
  Search,
  FileText,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Github,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import AuraObject3D from "../../components/AuraObject3D";

// ─── Aura Design Tokens ─────────────────────────────────────────────────────
const ACCENT = "#22d3ee";
const ACCENT_GLOW = "rgba(34, 211, 238, 0.45)";
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
// Hero Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#111111]"
    >
      {/* 3D centerpiece */}
      <div className="absolute inset-0 z-0">
        <AuraObject3D />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(17,17,17,0.35)_0%,rgba(17,17,17,0.85)_70%,#111111_100%)]" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#111111]/60 via-transparent to-[#111111]" />

      <motion.div
        style={
          reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }
        }
        className="relative z-10 container-custom text-center"
      >
        {/* Ghost outline title */}
        <h1
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11vw] lg:text-[9rem] font-bold text-transparent whitespace-nowrap select-none pointer-events-none"
          style={{ WebkitTextStroke: "1px rgba(34,211,238,0.14)" }}
        >
          WorkContext
        </h1>

        <motion.p
          variants={reveal}
          initial="hidden"
          animate="visible"
          custom={0}
          className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#22d3ee] mb-6"
        >
          The Context-Aware Workspace
        </motion.p>

        <motion.h2
          variants={reveal}
          initial="hidden"
          animate="visible"
          custom={1}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-[#f4f4f2] leading-[1.05] mb-6"
        >
          Your Workspace,
          <br />
          <span className="text-[#22d3ee]">Truly Understood.</span>
        </motion.h2>

        <motion.p
          variants={reveal}
          initial="hidden"
          animate="visible"
          custom={2}
          className="text-lg md:text-xl text-[rgba(244,244,242,0.55)] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The open-source productivity workspace that connects your docs, tasks,
          and team. No more searching. No more organizing. Just productive flow.
        </motion.p>

        <motion.div
          variants={reveal}
          initial="hidden"
          animate="visible"
          custom={3}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
        >
          <Button
            asChild
            size="lg"
            className="rounded-none bg-[#22d3ee] text-[#0b0b0b] hover:bg-[#67e8f9] font-semibold px-8 py-6 text-lg transition-all duration-300"
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT_GLOW}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Link href="/signup" className="flex items-center">
              Start For Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-none border-[rgba(255,255,255,0.16)] text-[#f4f4f2] bg-white/[0.03] hover:bg-white/[0.08] px-8 py-6 text-lg transition-all duration-300"
          >
            <a
              href="https://github.com/marowa-labs/workcontext"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </a>
          </Button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          variants={reveal}
          initial="hidden"
          animate="visible"
          custom={4}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[rgba(244,244,242,0.45)]"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[
                "from-[#22d3ee] to-[#0ea5e9]",
                "from-[#a78bfa] to-[#8b5cf6]",
                "from-[#f472b6] to-[#ec4899]",
              ].map((grad, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center ring-2 ring-[#111111]`}
                >
                  <Users className="h-3 w-3 text-white" />
                </div>
              ))}
            </div>
            <span>Trusted by productive teams worldwide</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-[rgba(255,255,255,0.16)]" />
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-[#22d3ee]" />
            <span>No credit card required</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.3em] text-[rgba(244,244,242,0.32)]">
          Scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-[#22d3ee] to-transparent relative overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 w-full h-4 bg-[#22d3ee]"
            animate={{ y: [-16, 48] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Preview Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function PreviewSection() {
  return (
    <section className="relative section-padding bg-[#111111] overflow-hidden">
      <div className="container-custom">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#22d3ee] mb-4">
            Product Preview
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-4">
            See WorkContext in Action
          </h2>
          <p className="text-lg md:text-xl text-[rgba(244,244,242,0.55)] max-w-2xl mx-auto">
            Experience the power of a workspace that understands your context.
          </p>
        </motion.div>

        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          custom={1}
          className="relative max-w-6xl mx-auto"
        >
          {/* Accent hairline top edge */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/60 to-transparent" />
          <div className="border border-[rgba(255,255,255,0.08)] bg-[#171717] p-2">
            <img
              src={homeGif.src}
              alt="WorkContext in Action"
              className="w-full h-auto object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Comparison Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function ComparisonSection() {
  const highlights = [
    {
      icon: PenTool,
      title: "Focus on What Matters",
      description:
        "Stop juggling multiple tools. Everything you need is in one place, so you can focus on what matters most — your ideas, your work, your team.",
    },
    {
      icon: Shield,
      title: "Context You Can Trust",
      description:
        "Every connection is transparent. See exactly why items are related and trace ideas back to their source with confidence.",
    },
    {
      icon: Users,
      title: "Made for Collaboration",
      description:
        "Real-time editing, comments, and version control keep your team aligned and moving fast.",
    },
  ];

  return (
    <section className="relative section-padding bg-[#0b0b0b] overflow-hidden">
      <div className="container-custom">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#22d3ee] mb-4">
            Why WorkContext
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-4">
            Built to Save You Time and Stress
          </h2>
          <p className="text-lg md:text-xl text-[rgba(244,244,242,0.55)] max-w-2xl mx-auto">
            Say goodbye to tool overload. WorkContext brings your docs, tasks,
            and team together in one intelligent workspace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <motion.div
              key={index}
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={index + 1}
              className="group border border-[rgba(255,255,255,0.08)] bg-[#171717] p-8 text-center transition-all duration-300 hover:border-[#22d3ee]/40 hover:bg-[#1a1a1a]"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 border border-[#22d3ee]/30 bg-[#22d3ee]/10 mb-6 group-hover:bg-[#22d3ee]/20 transition-colors duration-300">
                <highlight.icon className="h-7 w-7 text-[#22d3ee]" />
              </div>
              <h3 className="text-xl font-semibold text-[#f4f4f2] mb-4">
                {highlight.title}
              </h3>
              <p className="text-[rgba(244,244,242,0.55)] leading-relaxed">
                {highlight.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Features Grid Component
// ═══════════════════════════════════════════════════════════════════════════════
function FeaturesGrid() {
  const features = [
    {
      icon: Search,
      title: "Smart @-Mentions",
      description:
        "Type @ to instantly connect people, tasks, and docs across your workspace. No more searching through folders.",
      href: "/features",
    },
    {
      icon: Sparkles,
      title: "Action Extraction",
      description:
        "Highlight any text to create tasks, set deadlines, and assign team members automatically. Turn ideas into action.",
      href: "/features",
    },
    {
      icon: FileText,
      title: "Related Items",
      description:
        "See automatically suggested connections between your docs, tasks, and conversations. Discover what you forgot you knew.",
      href: "/features",
    },
    {
      icon: Bot,
      title: "Workspace Memory",
      description:
        "Ask questions across your entire workspace. Get instant answers with sources.",
      href: "/features",
    },
    {
      icon: Shield,
      title: "Source Transparency",
      description:
        "Every AI suggestion shows exactly where it came from. Hover to see the source doc, task, or conversation.",
      href: "/features",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description:
        "Work together seamlessly with live editing, comments, and version history. Your team, always in sync.",
      href: "/solutions/collaboration",
    },
  ];

  return (
    <section className="relative section-padding bg-[#111111] overflow-hidden">
      <div className="container-custom">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#22d3ee] mb-4">
            Capabilities
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-4">
            Everything You Need, Connected
          </h2>
          <p className="text-lg md:text-xl text-[rgba(244,244,242,0.55)] max-w-2xl mx-auto">
            From ideas to execution — docs, tasks, and team collaboration in one
            intelligent workspace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={(index % 3) + 1}
              className="group border border-[rgba(255,255,255,0.08)] bg-[#171717] p-8 cursor-pointer transition-all duration-300 hover:border-[#22d3ee]/40 hover:bg-[#1a1a1a]"
              onClick={() => (window.location.href = feature.href)}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 border border-[#22d3ee]/30 bg-[#22d3ee]/10 mb-6 group-hover:bg-[#22d3ee]/20 transition-colors duration-300">
                <feature.icon className="h-7 w-7 text-[#22d3ee]" />
              </div>
              <h3 className="text-xl font-semibold text-[#f4f4f2] mb-3">
                {feature.title}
              </h3>
              <p className="text-[rgba(244,244,242,0.55)] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Testimonials Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function TestimonialsSection() {
  const testimonials = [
    {
      quote:
        "The smart @-mentions saved me hours every week. I used to dig through folders looking for docs. Now WorkContext just shows me what's relevant, instantly.",
      author: "Sarah Chen",
      role: "Product Manager, Stripe",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    },
    {
      quote:
        "Finally, a workspace that actually understands context. I asked 'What did we decide about pricing?' and got the exact doc from 3 months ago with the decision.",
      author: "Michael Torres",
      role: "Head of Operations, Linear",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    {
      quote:
        "We replaced other tools with WorkContext. The action extraction alone saves our team 10+ hours a week. Game changer.",
      author: "Alex Rivera",
      role: "CEO, LaunchPad Startups",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
  ];

  return (
    <section className="relative section-padding bg-[#0b0b0b] overflow-hidden">
      <div className="container-custom">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          custom={0}
          className="text-center mb-16"
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-[#22d3ee] mb-4">
            Testimonials
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-4">
            Loved by Productive Teams
          </h2>
          <p className="text-lg md:text-xl text-[rgba(244,244,242,0.55)] max-w-2xl mx-auto">
            Join thousands of individuals and teams who&apos;ve replaced tool
            overload with intelligent, context-aware productivity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={reveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              custom={(index % 3) + 1}
              className="border border-[rgba(255,255,255,0.08)] bg-[#171717] p-8 transition-all duration-300 hover:border-[#22d3ee]/40 hover:bg-[#1a1a1a]"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4 ring-2 ring-[#22d3ee]/40">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#f4f4f2]">
                    {testimonial.author}
                  </h3>
                  <p className="text-[rgba(244,244,242,0.45)] text-sm">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-[rgba(244,244,242,0.65)] italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CTA Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function CTASection() {
  return (
    <section className="relative section-padding bg-[#111111] overflow-hidden">
      {/* Glow effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#22d3ee]/[0.06] blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[#22d3ee]/[0.04] blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <motion.div
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          custom={0}
          className="relative border border-[rgba(255,255,255,0.08)] bg-[#171717] p-12 md:p-16 text-center max-w-4xl mx-auto"
        >
          {/* Accent hairline top edge */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22d3ee]/60 to-transparent" />

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-6">
            Ready to Upgrade Your{" "}
            <span className="text-[#22d3ee]">Productivity?</span>
          </h2>
          <p className="text-lg md:text-xl text-[rgba(244,244,242,0.55)] mb-8 leading-relaxed">
            Join thousands of individuals and teams who&apos;ve already
            transformed their workflow. Start free today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="rounded-none bg-[#22d3ee] text-[#0b0b0b] hover:bg-[#67e8f9] font-semibold px-8 py-6 text-lg transition-all duration-300"
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT_GLOW}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Link href="/signup" className="flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none border-[rgba(255,255,255,0.16)] text-[#f4f4f2] bg-white/[0.03] hover:bg-white/[0.08] px-8 py-6 text-lg transition-all duration-300"
            >
              <a
                href="https://github.com/marowa-labs/workcontext"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Github className="mr-2 h-5 w-5" />
                Join Our Community
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm text-[rgba(244,244,242,0.45)]">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#22d3ee]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#22d3ee]" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#22d3ee]" />
              <span>Available worldwide</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main HomePage Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  return (
    <Layout>
      <HeroSection />
      <PreviewSection />
      <ComparisonSection />
      <FeaturesGrid />
      <TestimonialsSection />
      <CTASection />
    </Layout>
  );
}
