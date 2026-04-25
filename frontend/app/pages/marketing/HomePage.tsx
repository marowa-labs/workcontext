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
  BookOpen,
  Play,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import Layout from "../../components/Layout";
import { useState, useEffect } from "react";

// Hero Section Component
function HeroSection() {
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(50);

  const phrases = [
    {
      text: "Turn Academic Overwhelm into \nActionable Insights.",
      gradientWord: "Actionable Insights.",
    },
    {
      text: "Discover, Synthesize, and Innovate \nwith Confidence",
      gradientWord: "with Confidence",
    },
  ];

  useEffect(() => {
    const currentPhrase = phrases[loopNum % phrases.length];
    const fullText = currentPhrase.text;

    const handleType = () => {
      if (isDeleting) {
        // Erasing
        setTypedText(fullText.substring(0, typedText.length - 1));
        setTypingSpeed(100); // Faster erasing

        if (typedText === "") {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
          setTypingSpeed(2500); // Pause before typing next phrase
        }
      } else {
        // Typing
        setTypedText(fullText.substring(0, typedText.length + 1));
        setTypingSpeed(50); // Normal typing speed

        if (typedText === fullText) {
          // Pause at end of phrase before deleting
          setTimeout(() => setIsDeleting(true), 2500);
        }
      }
    };

    const timer = setTimeout(handleType, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, loopNum, typingSpeed]);

  // Get current phrase for gradient handling
  const currentPhrase = phrases[loopNum % phrases.length];

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
        }}>
        <div className="absolute inset-0 bg-[#121212] opacity-90"></div>
      </div>

      <div className="relative z-10 container-custom text-center">
        <div className="w-full mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight whitespace-pre-line">
            {typedText.includes(currentPhrase.gradientWord)
              ? typedText.replace(currentPhrase.gradientWord, "")
              : typedText}
            {typedText.includes(currentPhrase.gradientWord) && (
              <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                {currentPhrase.gradientWord}
              </span>
            )}
            {typedText && (
              <span className="animate-pulse ml-1 text-blue-400">|</span>
            )}
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            The AI Research Co-Pilot that helps you discover, synthesize, and
            innovate without the pitfalls of unreliable AI. 250M+ papers,
            verified citations, and zero hallucinations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-700 text-white hover:from-blue-700 hover:to-cyan-800 font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
              <Link href="/signup" className="flex items-center">
                Start Researching Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-300 text-gray-600 bg-gray-200 hover:bg-gray-400 backdrop-blur-sm px-8 py-6 text-lg">
              <Play className="mr-2 h-5 w-5" />
              Watch 60-sec Demo
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
                Trusted by researchers at top institutions
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
            See ScholarForge AI in Action
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Experience the power of integrated academic writing tools.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Hero Image/Preview */}
          <div className="mt-16 relative">
            <div className="relative rounded-2xl border border-gray-300 bg-white shadow-2xl overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
              <div className="p-8 bg-white relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                  <span className="ml-4 text-xl font-semibold text-muted-foreground">
                    Climate_Research_Paper.docx
                  </span>
                </div>
                <div className="space-y-3 font-sans text-sm leading-relaxed text-gray-500">
                  <h3 className="font-serif text-xl font-semibold text-gray-600 mb-4">
                    The Impact of Climate Change on Marine Ecosystems
                  </h3>
                  <p className="text-gray-600">
                    Climate change represents one of the most significant
                    challenges facing marine ecosystems today.
                    <span
                      className="bg-blue-100 text-blue-800 px-1 rounded border-b-2 border-blue-500 cursor-pointer"
                      title="Verified Citation: Johnson et al. (2024)">
                      Rising ocean temperatures have led to widespread coral
                      bleaching events, threatening biodiversity across tropical
                      reef systems.
                    </span>
                  </p>
                  <p className="text-gray-600">
                    Recent studies indicate that
                    <span
                      className="bg-purple-100 text-purple-800 px-1 rounded border-b-2 border-purple-500 cursor-pointer"
                      title="Gap Analysis: Limited research on cold-water adaptation">
                      the acidification of seawater is occuring at an
                      unprecedented rate
                    </span>
                    , with pH levels dropping by 0.1 units since the industrial
                    revolution.
                  </p>
                  <p className="text-gray-600">
                    Furthermore, the migration patterns of numerous species have
                    been
                    <span
                      className="bg-green-100 px-1 rounded border-b-2 border-green-500 cursor-pointer"
                      title="Consensus: High agreement across 15 papers">
                      significantly altered
                    </span>
                    , disrupting established food chains and ecological
                    relationships...
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -left-4 top-1/4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Search className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Intelligent Discovery</p>
                  <p className="text-xs text-muted-foreground">
                    15 Relevant Papers Found
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-1/3 bg-white rounded-lg shadow-xl border border-gray-200 p-4 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Gap Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    New Research Opportunity
                  </p>
                </div>
              </div>
            </div>
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
      title: "Focus on Writing",
      description:
        "Stop juggling multiple tools. Everything you need is in one place, so you can focus on what matters most - your ideas.",
    },
    {
      icon: Shield,
      title: "Accuracy & Ethics First",
      description:
        "Built-in citation verification and human-in-the-loop safeguards ensure your work meets the highest academic standards.",
    },
    {
      icon: Users,
      title: "Made for Collaboration",
      description:
        "Real-time editing, comments, and version control make group projects and peer reviews effortless.",
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
            Say goodbye to tool overload. Everything you need is finally in one
            place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((highlight, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border border-gray-300">
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
      title: "Intelligent Paper Discovery",
      description:
        "Scan 250M+ papers to find relevant, high-quality sources without endless scrolling. Includes safety classifications.",
      color: "from-purple-600 to-purple-800",
      href: "/solutions/analytics", // TODO: Update to Discovery route when available
    },
    {
      icon: Sparkles,
      title: "Smart Summarization",
      description:
        "Generate concise, accurate summaries and identify research gaps with multi-model verification.",
      color: "from-pink-600 to-pink-800",
      href: "/solutions/ai-writing-assistant",
    },
    {
      icon: FileText,
      title: "Citation Confidence Auditor",
      description:
        "Get confidence scores for each section and warnings about outdated or unsupported claims with suggestions for missing links.",
      color: "from-green-600 to-green-800",
      href: "/solutions/citations",
    },
    {
      icon: Bot,
      title: "Personalized Research Feed",
      description:
        "Tailored paper suggestions based on your history and deep personalization via user profiles.",
      color: "from-blue-600 to-blue-800",
      href: "/solutions/ai-writing-assistant",
    },
    {
      icon: Shield,
      title: "Defensibility Log",
      description:
        "Generate authorship certificates proving your work is original with time tracking and manual effort verification.",
      color: "from-amber-600 to-amber-800",
      href: "/solutions/analytics",
    },
    {
      icon: Users,
      title: "Real-time Collaboration",
      description:
        "Work together seamlessly with live editing and version history.",
      color: "from-orange-600 to-orange-800",
      href: "/solutions/collaboration",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 mb-4">
            Five Core Features for Academic Success and Beyond
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            From originality to publication, all essential tools in one
            platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              onClick={() => (window.location.href = feature.href)}
              className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group bg-white border border-gray-300">
              <CardContent className="p-8">
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
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
        "ScholarForge AI's gap analysis helped me find a unique angle for my thesis in minutes, not months. It's like having a super-powered research assistant.",
      author: "Dr. Sarah Johnson",
      role: "PhD Candidate, MIT",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop",
    },
    {
      quote:
        "The verified citations feature is a lifesaver. Finally, an AI tool that respects academic rigor and doesn't hallucinate sources.",
      author: "Prof. Michael Chen",
      role: "Department of Literature, Stanford University",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
    {
      quote:
        "I love how it summarizes complex papers without losing the nuance. It helps me synthesize information faster than ever before.",
      author: "Alex Rivera",
      role: "Graduate Student, UC Berkeley",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-600 mb-4">
            Loved by Academics Worldwide
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Join thousands of students and researchers who've transformed their
            workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="border-0 shadow-lg bg-white border border-gray-300">
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
      {/* Background with academic shapes */}
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
            Ready to Upgrade Your Academic Life?
          </h2>
          <p className="text-lg md:text-xl text-gray-500 mb-8 leading-relaxed">
            Join thousands of students and researchers who've already
            transformed their writing workflow. Start your free trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-700 text-gray-300 hover:from-blue-700 hover:to-cyan-800 font-semibold px-8 py-6 text-lg shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
              <Link href="/signup" className="flex items-center">
                Get Started Free Today
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-gray-500 text-gray-300 hover:bg-gray-500 backdrop-blur-sm px-8 py-6 text-lg">
              <Link href="/docs/quickstart" className="flex items-center">
                See How It Works
                <BookOpen className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-gray-500 text-gray-300 hover:bg-gray-500 backdrop-blur-sm px-8 py-6 text-lg">
              <a
                href="https://discord.gg/2MMSdX3Uee"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center">
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
