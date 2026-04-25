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

      {/* Academic illustrations background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-gray-200xl">📚</div>
        <div className="absolute top-40 right-20 text-4xl">✏️</div>
        <div className="absolute bottom-40 left-1/4 text-5xl">🎓</div>
        <div className="absolute bottom-20 right-10 text-3xl">📖</div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Five Core Features for Academic{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Success
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Transform writing from a source of anxiety to confidence with our
            five integrated core features that ensure originality, credibility,
            humanity, defensibility, and professional publication.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 btn-glow"
              onClick={handleGetStarted}>
              Try It Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-8 py-6 btn-glow border border-white">
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
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}>
      {/* Content */}
      <div className={reverse ? "lg:col-start-2" : ""}>
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${color} mb-6`}>
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
      icon: Search,
      title: "Explainable Originality Map",
      description:
        "Color-coded heatmap shows exactly which parts of your document need attention, with clear safety classifications (Green/Yellow/Red) for complete transparency.",
      benefits: [
        "Interactive heatmap visualization of document originality",
        "Safety classification for each sentence (Green/Yellow/Red)",
        "One-click rephrase suggestions for flagged content",
        "Detailed source matching for transparency",
      ],
      imageUrl:
        "https://image2url.com/images/1766035339540-bbbba493-1dcb-4604-8f70-23c6a9a878a2.png?w=800&h=600&fit=crop",
      color: "from-purple-600 to-purple-800",
    },
    {
      icon: FileText,
      title: "Citation Confidence Auditor",
      description:
        "Get confidence scores for each section and warnings about outdated or unsupported claims with suggestions for missing links.",
      benefits: [
        "Section-by-section confidence scoring",
        "Warnings about outdated citations (3+ years old)",
        "Logic validation between claims and citations",
        "Intelligent suggestions for missing references",
      ],
      imageUrl:
        "https://image2url.com/images/1766041624051-57126843-7e86-487c-875c-682a621bbc6e.png?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
      reverse: true,
    },
    {
      icon: Bot,
      title: "Submission-Safe Writing Mode",
      description:
        "Real-time AI-detection meter helps you avoid robotic writing patterns with humanizing suggestions as you type.",
      benefits: [
        "Live AI-probability meter as you write",
        "Highlighting of robotic sentences",
        "Humanizing prompts instead of auto-fixing",
        "Maintain your unique writing voice",
      ],
      imageUrl:
        "https://image2url.com/images/1766035335298-270bb4d5-1753-46ef-b984-91b47e54df1f.png?w=800&h=600&fit=crop",
      color: "from-blue-600 to-blue-800",
    },
    {
      icon: Shield,
      title: "Defensibility Log",
      description:
        "Generate authorship certificates proving your work is original with time tracking and manual effort verification.",
      benefits: [
        "Silent activity logging (time/keystrokes)",
        "Authorship certificate generation",
        "Provenance data for verification",
        "Seal of authenticity for professors",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      color: "from-amber-600 to-amber-800",
      reverse: true,
    },
    {
      icon: Download,
      title: "One-Click Publication Suite",
      description:
        "Automated formatting, cover pages, and structured exports in APA, MLA, and other academic formats.",
      benefits: [
        "Auto-TOC extraction from document structure",
        "APA/MLA compliant cover page generation",
        "Structural fidelity audit before export",
        "High-fidelity exports (PDF, DOCX, LaTeX)",
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

// Closing Mini-CTA
function ClosingCTA() {
  return (
    <>
      <section className="section-padding bg-[#121212]">
        <div className="container-custom">
          <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-white">
            <CardContent className="p-12 text-center">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
              <div className="relative z-10">
                <Lightbulb className="h-16 w-16 text-yellow-300 mx-auto mb-6" />

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Built to Help You Succeed at Every Stage
                </h2>

                <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
                  Whether you're a first-year student or a seasoned researcher,
                  ScholarForge AIadapts to your needs and grows with your
                  academic journey.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 btn-glow">
                    <Link href="/signup" className="flex items-center">
                      Start Your Free Trial
                      <Zap className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6"
                    onClick={() =>
                      window.open(
                        "https://calendly.com/audacityimpact/30min",
                        "_blank",
                      )
                    }>
                    Schedule a Demo
                  </Button>
                </div>

                <div className="flex justify-center items-center gap-6 mt-8 text-gray-200 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Setup in 2 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Enterprise-grade security</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

export default function FeaturesPage() {
  return (
    <Layout>
      <IntroHero />
      <FeaturesPresentationFlow />
      <ClosingCTA />
    </Layout>
  );
}
