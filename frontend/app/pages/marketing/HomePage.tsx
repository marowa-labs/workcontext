"use client";

import homeGif from "@/app/assets/home.gif";
import LineStitch from "../../components/LineStitch";
import Threads from "../../components/Threads";
import {
  PenTool,
  Shield,
  Users,
  Bot,
  Search,
  FileText,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Github,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import Layout from "../../components/Layout";
import { useState, useEffect, useRef } from "react";

// ─── Wave Hero Component — 2 LineStitch layers (workcontext + workspace) ──
function WaveHero() {
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animateRef = useRef<DOMHighResTimeStamp>(0);
  const layersRef = useRef<{ particles: any[]; color: string }[]>([]);

  // Sample text pixels into stitch positions
  function sampleTextPositions(
    text: string,
    W: number,
    H: number,
    yPos: number,
  ) {
    // Create off-screen canvas - this runs on client after hydration
    const off =
      typeof document !== "undefined" ? document.createElement("canvas") : null;
    if (!off || !off.getContext) return [];
    const offCtx = off.getContext("2d")!;
    off.width = W;
    off.height = H;
    const fontSize = Math.min(W * 0.11, 120);
    offCtx.fillStyle = "#fff";
    offCtx.font = `600 ${fontSize}px Inter, sans-serif`;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "middle";
    offCtx.fillText(text, W / 2, H * yPos);
    const imgData = offCtx.getImageData(0, 0, W, H).data;
    const positions: { x: number; y: number }[] = [];
    const density = 4;
    for (let y = 0; y < H; y += density) {
      for (let x = 0; x < W; x += density) {
        const idx = (y * W + x) * 4;
        if (imgData[idx + 3] > 100) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  // Group positions into rows to form stitch lines
  function initWaveLayer(text: string, yPos: number, color: string) {
    const W = width > 0 ? width : 800;
    const H = height > 0 ? height : 400;
    const positions = sampleTextPositions(text, W, H, yPos);

    // Group into rows
    const rows = new Map<number, { x: number; y: number }[]>();
    positions.forEach((pos) => {
      const key = Math.round(pos.y / 8);
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key)!.push(pos);
    });

    const particles: {
      x: number;
      y: number;
      baseY: number;
      next: { x: number; y: number } | null;
      phase: number;
      size: number;
      baseOpacity: number;
    }[] = [];
    rows.forEach((rowPositions) => {
      rowPositions.sort((a, b) => a.x - b.x);
      rowPositions.forEach((pos, idx) => {
        const next = rowPositions[idx + 1];
        particles.push({
          x: pos.x,
          y: pos.y,
          baseY: pos.y,
          next: next || null,
          phase: Math.random() * Math.PI * 2,
          size: 2.2,
          baseOpacity: 0.85 + Math.random() * 0.15,
        });
      });
    });

    return { particles, color: color };
  }

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animateRef.current);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (width <= 0 || height <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize layers
    layersRef.current = [
      initWaveLayer("workcontext", 0.22, "#3b82f6"),
      initWaveLayer("workspace", 0.68, "#f59e0b"),
    ];

    let waveTime = 0;
    const animate = (now: number) => {
      waveTime = now * 0.001;
      ctx.clearRect(0, 0, width, height);

      layersRef.current.forEach((layer, layerIdx) => {
        layer.particles.forEach((p) => {
          const wave = Math.sin(waveTime * 2.2 + p.x * 0.012);
          p.y = p.baseY + wave * 30;
          const opacity = (Math.abs(wave) * 0.6 + 0.4) * p.baseOpacity;
          // Rainbow hue: shifts over time + varies by x position + layer offset
          const hue = (waveTime * 60 + p.x * 0.15 + layerIdx * 40) % 360;
          ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          if (p.next) {
            const nWave = Math.sin(waveTime * 2.2 + p.next.x * 0.012);
            const nY = p.next.baseY + nWave * 30;
            const nHue =
              (waveTime * 60 + p.next.x * 0.15 + layerIdx * 40) % 360;
            ctx.strokeStyle = `hsla(${nHue}, 90%, 60%, ${opacity * 0.9})`;
            ctx.lineWidth = p.size * 0.9;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.next.x, nY);
            ctx.stroke();
          }
        });
      });

      animateRef.current = requestAnimationFrame(animate);
    };

    animateRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animateRef.current);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none" }}
      width={width}
      height={height}
    />
  );
}

// ─── Glass Card Wrapper ─────────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
  hover = true,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl ${
        hover
          ? "hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
          : ""
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Section Wrapper ────────────────────────────────────────────────────────
function GlassSection({
  children,
  className = "",
  withThreads = false,
}: {
  children: React.ReactNode;
  className?: string;
  withThreads?: boolean;
}) {
  return (
    <section
      className={`relative section-padding bg-[#0a0a0f] overflow-hidden ${className}`}
    >
      {withThreads && (
        <div className="absolute inset-0 z-0 opacity-20">
          <Threads
            color={[0.3, 0.5, 1]}
            amplitude={0.8}
            distance={0.3}
            enableMouseInteraction={true}
          />
        </div>
      )}
      <div className="relative z-10 container-custom">{children}</div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Hero Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function HeroSection() {
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);

  const phrases = [
    {
      line1: "Your Workspace,",
      line2: "Truly Understood.",
    },
    {
      line1: "Connect Ideas,",
      line2: "Get Things Done.",
    },
  ];

  const [line1Text, setLine1Text] = useState("");
  const [line2Text, setLine2Text] = useState("");
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[loopNum % phrases.length];
    const line1 = currentPhrase.line1;
    const line2 = currentPhrase.line2;

    const handleType = () => {
      if (phase === 0) {
        if (line1Text.length < line1.length) {
          setLine1Text(line1.substring(0, line1Text.length + 1));
          setTypingSpeed(50);
        } else {
          setPhase(1);
          setTypingSpeed(400);
        }
      } else if (phase === 1) {
        if (line2Text.length < line2.length) {
          setLine2Text(line2.substring(0, line2Text.length + 1));
          setTypingSpeed(50);
        } else {
          setPhase(2);
          setTypingSpeed(2500);
        }
      } else if (phase === 2) {
        if (line2Text.length > 0) {
          setLine2Text(line2Text.substring(0, line2Text.length - 1));
          setTypingSpeed(40);
        } else {
          setPhase(3);
          setTypingSpeed(200);
        }
      } else if (phase === 3) {
        if (line1Text.length > 0) {
          setLine1Text(line1Text.substring(0, line1Text.length - 1));
          setTypingSpeed(40);
        } else {
          setPhase(0);
          setLoopNum(loopNum + 1);
          setTypingSpeed(1500);
        }
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [line1Text, line2Text, phase, loopNum, typingSpeed]);

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Wave Hero — 2 LineStitch layers */}
      <WaveHero />
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-[#0a0a0f]" />

      <div className="relative z-10 container-custom text-center">
        <div className="w-full mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight min-h-[1.2em]">
            {line1Text}
            {phase === 0 &&
              line1Text.length <
                (phrases[loopNum % phrases.length]?.line1?.length ?? 0) && (
                <span className="animate-pulse ml-1 text-blue-400">|</span>
              )}
          </h1>
          <p className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent leading-tight min-h-[1.2em]">
            {line2Text}
            {((phase === 1 &&
              line2Text.length <
                (phrases[loopNum % phrases.length]?.line2?.length ?? 0)) ||
              (phase === 2 && line2Text.length > 0)) && (
              <span className="animate-pulse ml-1 text-blue-400">|</span>
            )}
          </p>

          <p className="text-lg md:text-xl text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed mt-6">
            The context-aware productivity open-source workspace that connects
            your docs, tasks, and team. No more searching. No more organizing.
            Just productive flow.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 font-semibold px-8 py-6 text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
            >
              <Link href="/signup" className="flex items-center">
                Start For Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg"
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
          </div>

          {/* Trust Indicator */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-400 text-sm">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-[#0a0a0f]">
                  <Users className="h-3 w-3 text-white" />
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center ring-2 ring-[#0a0a0f]">
                  <Users className="h-3 w-3 text-white" />
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center ring-2 ring-[#0a0a0f]">
                  <Users className="h-3 w-3 text-white" />
                </div>
              </div>
              <span className="ml-2">
                Trusted by productive teams worldwide
              </span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-600 rounded-full" />
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-blue-400 mr-1" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Preview Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function PreviewSection() {
  return (
    <GlassSection>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          See WorkContext in Action
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Experience the power of a workspace that understands your context.
        </p>
      </div>

      <div className="relative mt-16 flex justify-center">
        <GlassCard
          className="p-2 overflow-hidden max-w-6xl w-full"
          hover={false}
        >
          <div className="rounded-xl overflow-hidden">
            <img
              src={homeGif.src}
              alt="WorkContext in Action"
              className="w-full h-auto object-cover"
            />
          </div>
        </GlassCard>
      </div>
    </GlassSection>
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
    <GlassSection withThreads>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Built to Save You Time and Stress
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Say goodbye to tool overload. WorkContext brings your docs, tasks, and
          team together in one intelligent workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {highlights.map((highlight, index) => (
          <GlassCard key={index} className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 mb-6">
              <highlight.icon className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">
              {highlight.title}
            </h3>
            <p className="text-gray-400 leading-relaxed">
              {highlight.description}
            </p>
          </GlassCard>
        ))}
      </div>
    </GlassSection>
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
      color: "from-purple-500/20 to-purple-600/20",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-400",
      href: "/features",
    },
    {
      icon: Sparkles,
      title: "Action Extraction",
      description:
        "Highlight any text to create tasks, set deadlines, and assign team members automatically. Turn ideas into action.",
      color: "from-pink-500/20 to-pink-600/20",
      borderColor: "border-pink-500/30",
      iconColor: "text-pink-400",
      href: "/features",
    },
    {
      icon: FileText,
      title: "Related Items",
      description:
        "See automatically suggested connections between your docs, tasks, and conversations. Discover what you forgot you knew.",
      color: "from-green-500/20 to-green-600/20",
      borderColor: "border-green-500/30",
      iconColor: "text-green-400",
      href: "/features",
    },
    {
      icon: Bot,
      title: "Workspace Memory",
      description:
        "Ask questions across your entire workspace. Get instant answers with sources.",
      color: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-400",
      href: "/features",
    },
    {
      icon: Shield,
      title: "Source Transparency",
      description:
        "Every AI suggestion shows exactly where it came from. Hover to see the source doc, task, or conversation.",
      color: "from-amber-500/20 to-amber-600/20",
      borderColor: "border-amber-500/30",
      iconColor: "text-amber-400",
      href: "/features",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description:
        "Work together seamlessly with live editing, comments, and version history. Your team, always in sync.",
      color: "from-orange-500/20 to-orange-600/20",
      borderColor: "border-orange-500/30",
      iconColor: "text-orange-400",
      href: "/solutions/collaboration",
    },
  ];

  return (
    <GlassSection>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Everything You Need, Connected
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          From ideas to execution — docs, tasks, and team collaboration in one
          intelligent workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <GlassCard
            key={index}
            className="p-8 cursor-pointer group"
            onClick={() => (window.location.href = feature.href)}
          >
            <div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} border ${feature.borderColor} mb-6 group-hover:scale-110 transition-transform duration-300`}
            >
              <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-400 leading-relaxed">
              {feature.description}
            </p>
          </GlassCard>
        ))}
      </div>
    </GlassSection>
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
    <GlassSection withThreads>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Loved by Productive Teams
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Join thousands of individuals and teams who&apos;ve replaced tool
          overload with intelligent, context-aware productivity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <GlassCard key={index} className="p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden mr-4 ring-2 ring-white/20">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {testimonial.author}
                </h3>
                <p className="text-gray-400 text-sm">{testimonial.role}</p>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
          </GlassCard>
        ))}
      </div>
    </GlassSection>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CTA Section Component
// ═══════════════════════════════════════════════════════════════════════════════
function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden bg-[#0a0a0f]">
      {/* Threads background */}
      <div className="absolute inset-0 z-0 opacity-15">
        <Threads
          color={[0.2, 0.4, 1]}
          amplitude={1}
          distance={0.2}
          enableMouseInteraction={true}
        />
      </div>

      {/* Glow effects */}
      <div className="absolute inset-0 z-[1]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <GlassCard
          className="p-12 md:p-16 text-center max-w-4xl mx-auto"
          hover={false}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Upgrade Your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Productivity?
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-8 leading-relaxed">
            Join thousands of individuals and teams who&apos;ve already
            transformed their workflow. Start free today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 font-semibold px-8 py-6 text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
            >
              <Link href="/signup" className="flex items-center">
                Get Started Free
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm px-8 py-6 text-lg"
            >
              <a
                href="https://github.com/marowa-labs/workcontext"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                Join Our Community
                <Users className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <span>Available worldwide</span>
            </div>
          </div>
        </GlassCard>
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
