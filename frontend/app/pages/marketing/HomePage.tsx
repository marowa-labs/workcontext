"use client";

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
import { useState, useEffect } from "react";

// Hero Section Component
function HeroSection() {
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);

  const phrases = [
    {
      line1: "Your Workspace,",
      line2: "Truly Understood.",
      gradientWord: "Truly Understood.",
    },
    {
      line1: "Connect Ideas,",
      line2: "Get Things Done.",
      gradientWord: "Get Things Done.",
    },
  ];

  // Track typing progress for each line independently
  const [line1Text, setLine1Text] = useState("");
  const [line2Text, setLine2Text] = useState("");
  // Phase: 0=typing line1, 1=typing line2, 2=deleting line2, 3=deleting line1
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const currentPhrase = phrases[loopNum % phrases.length];
    const line1 = currentPhrase.line1;
    const line2 = currentPhrase.line2;

    const handleType = () => {
      if (phase === 0) {
        // Typing line 1
        if (line1Text.length < line1.length) {
          setLine1Text(line1.substring(0, line1Text.length + 1));
          setTypingSpeed(50);
        } else {
          // Line 1 complete, move to typing line 2
          setPhase(1);
          setTypingSpeed(400); // Pause before typing line2
        }
      } else if (phase === 1) {
        // Typing line 2
        if (line2Text.length < line2.length) {
          setLine2Text(line2.substring(0, line2Text.length + 1));
          setTypingSpeed(50);
        } else {
          // Both lines complete, pause then start deleting
          setPhase(2);
          setTypingSpeed(2500); // Pause before deleting
        }
      } else if (phase === 2) {
        // Deleting line 2
        if (line2Text.length > 0) {
          setLine2Text(line2Text.substring(0, line2Text.length - 1));
          setTypingSpeed(40);
        } else {
          // Line 2 erased, move to deleting line 1
          setPhase(3);
          setTypingSpeed(200);
        }
      } else if (phase === 3) {
        // Deleting line 1
        if (line1Text.length > 0) {
          setLine1Text(line1Text.substring(0, line1Text.length - 1));
          setTypingSpeed(40);
        } else {
          // All erased, move to next phrase
          setPhase(0);
          setLoopNum(loopNum + 1);
          setTypingSpeed(1500); // Pause before next phrase
        }
      }
    };

    const timer = setTimeout(handleType, typingSpeed);

    return () => clearTimeout(timer);
  }, [line1Text, line2Text, phase, loopNum, typingSpeed]);

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#121212]">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&h=1080&fit=crop&crop=center")',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[#121212] opacity-90"></div>
      </div>

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

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            The context-aware productivity open-source workspace that connects
            your docs, tasks, and team. No more searching. No more organizing.
            Just productive flow.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white hover:from-blue-700 hover:to-cyan-800 font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
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
              className="border-gray-300 text-gray-600 bg-gray-200 hover:bg-gray-400 backdrop-blur-sm px-8 py-6 text-lg"
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

          {/* Enhanced Trust Indicator with People Icons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-gray-300 text-sm">
            <div className="flex items-center gap-1">
              {/* User Icon Group */}
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Users className="h-3 w-3 text-gray-600" />
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                  <Users className="h-3 w-3 text-gray-600" />
                </div>
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Users className="h-3 w-3 text-gray-600" />
                </div>
              </div>
              <span className="ml-2">
                Trusted by productive teams worldwide
              </span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-500 rounded-full"></div>
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

// Preview Section Component
function PreviewSection() {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 mb-4">
            See WorkContext in Action
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Experience the power of a workspace that understands your context.
          </p>
        </div>

        <div className="relative mt-16 flex justify-center">
          <div className="rounded-2xl border border-gray-300 shadow-2xl overflow-hidden max-w-6xl w-full">
            <img
              src="https://www.image2url.com/r2/default/gifs/1782221447847-0402c750-20fe-41ef-b142-c5a08a2d0d4b.gif"
              alt="WorkContext in Action"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// Comparison Section Component
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
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 mb-4">
            Built to Save You Time and Stress
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Say goodbye to tool overload. WorkContext brings your docs, tasks,
            and team together in one intelligent workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border border-gray-300"
            >
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 mb-6">
                  <highlight.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-4">
                  {highlight.title}
                </h3>
                <p className="text-gray-600 font-semibold leading-relaxed">
                  {highlight.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Features Grid Component
function FeaturesGrid() {
  const features = [
    {
      icon: Search,
      title: "Smart @-Mentions",
      description:
        "Type @ to instantly connect people, tasks, and docs across your workspace. No more searching through folders.",
      color: "from-purple-600 to-purple-800",
      href: "/features",
    },
    {
      icon: Sparkles,
      title: "Action Extraction",
      description:
        "Highlight any text to create tasks, set deadlines, and assign team members automatically. Turn ideas into action.",
      color: "from-pink-600 to-pink-800",
      href: "/features",
    },
    {
      icon: FileText,
      title: "Related Items",
      description:
        "See automatically suggested connections between your docs, tasks, and conversations. Discover what you forgot you knew.",
      color: "from-green-600 to-green-800",
      href: "/features",
    },
    {
      icon: Bot,
      title: "Workspace Memory",
      description:
        "Ask questions across your entire workspace. Get instant answers with sources.",
      color: "from-blue-600 to-blue-800",
      href: "/features",
    },
    {
      icon: Shield,
      title: "Source Transparency",
      description:
        "Every AI suggestion shows exactly where it came from. Hover to see the source doc, task, or conversation.",
      color: "from-amber-600 to-amber-800",
      href: "/features",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description:
        "Work together seamlessly with live editing, comments, and version history. Your team, always in sync.",
      color: "from-orange-600 to-orange-800",
      href: "/solutions/collaboration",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 mb-4">
            Everything You Need, Connected
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            From ideas to execution — docs, tasks, and team collaboration in one
            intelligent workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              onClick={() => (window.location.href = feature.href)}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white border border-gray-300"
            >
              <CardContent className="p-8">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 font-semibold leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section Component
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
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 mb-4">
            Loved by Productive Teams
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Join thousands of individuals and teams who've replaced tool
            overload with intelligent, context-aware productivity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg bg-white border border-gray-300"
            >
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600">
                      {testimonial.author}
                    </h3>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section Component
function CTASection() {
  return (
    <section className="section-padding relative overflow-hidden bg-[#121212]">
      {/* Background with productivity shapes */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 opacity-95"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-blue-500/30 rounded-full"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-blue-500/30 rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-blue-500/30 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 border-2 border-blue-500/30 rotate-12"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Upgrade Your Productivity?
          </h2>
          <p className="text-lg md:text-xl text-gray-500 mb-8 leading-relaxed">
            Join thousands of individuals and teams who've already transformed
            their workflow. Start your Free today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-700 text-gray-300 hover:from-blue-700 hover:to-cyan-800 font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300"
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
              className="border-gray-500 text-gray-300 hover:bg-gray-500 backdrop-blur-sm px-8 py-6 text-lg"
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
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-300 text-sm">
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
        </div>
      </div>
    </section>
  );
}

// Main HomePage Component
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
