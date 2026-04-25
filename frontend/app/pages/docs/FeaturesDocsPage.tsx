"use client";

import {
  Bot,
  Search,
  FileText,
  Users,
  BarChart3,
  Download,
  Lightbulb,
  Shield,
  Clock,
  CheckCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { useState } from "react";

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

        <h3 className="text-2xl md:text-3xl font-bold text-black text-black mb-4">
          {title}
        </h3>

        <p className="text-lg text-black dark:text-black mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-black dark:text-black">
                {benefit}
              </span>
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
      title: "AI Writing Assistant",
      description:
        "Get intelligent, contextual suggestions as you write. Our AI understands academic writing conventions and helps you express ideas clearly and professionally.",
      benefits: [
        "Real-time grammar and style corrections",
        "Context-aware vocabulary suggestions",
        "Academic tone and clarity improvements",
        "Sentence structure optimization",
      ],
      imageUrl:
        "https://image2url.com/images/1766035335298-270bb4d5-1753-46ef-b984-91b47e54df1f.png?w=800&h=600&fit=crop",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Search,
      title: "Plagiarism Detection",
      description:
        "Ensure academic integrity with comprehensive plagiarism scanning. Get detailed originality reports and learn how to properly cite sources.",
      benefits: [
        "Scan against billions of web pages and academic papers",
        "Detailed similarity reports with source highlighting",
        "Citation suggestions for flagged content",
        "Educational guidance on avoiding plagiarism",
      ],
      imageUrl:
        "https://image2url.com/images/1766035339540-bbbba493-1dcb-4604-8f70-23c6a9a878a2.png?w=800&h=600&fit=crop",
      color: "from-purple-500 to-pink-500",
      reverse: true,
    },
    {
      icon: FileText,
      title: "Smart Citations",
      description:
        "Never worry about citation formatting again. Automatically generate perfect citations in any style with our intelligent reference management.",
      benefits: [
        "Support for APA, MLA, Chicago, Harvard, and more",
        "Automatic citation from URLs, DOIs, and ISBNs",
        "In-text citation insertion with one click",
        "Bibliography generation and formatting",
      ],
      imageUrl:
        "https://image2url.com/images/1766041624051-57126843-7e86-487c-875c-682a621bbc6e.png?w=800&h=600&fit=crop",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Collaboration Made Simple",
      description:
        "Work together seamlessly with real-time editing, intelligent commenting, and comprehensive version control designed for academic projects.",
      benefits: [
        "Real-time collaborative editing",
        "Smart commenting and suggestion system",
        "Complete version history and rollback",
        "Role-based permissions for team projects",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
      color: "from-orange-500 to-red-500",
      reverse: true,
    },
    {
      icon: BarChart3,
      title: "Project Dashboard",
      description:
        "Stay organized and meet deadlines with comprehensive project tracking, progress visualization, and intelligent scheduling assistance.",
      benefits: [
        "Visual progress tracking and analytics",
        "Deadline management and reminders",
        "Writing goals and milestone tracking",
        "Research organization and note-taking",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: Download,
      title: "Export Anywhere",
      description:
        "Your work, your way. Export to any format you need for submission, publication, or sharing with perfect formatting every time.",
      benefits: [
        "Export to Word, PDF, LaTeX, and more",
        "Maintain formatting across all formats",
        "Direct integration with Google Docs and Dropbox",
        "Custom template support for institutions",
      ],
      imageUrl:
        "https://image2url.com/images/1766041414714-d21fc2eb-7026-4d37-9bb7-2c564aed93ab.png?w=800&h=600&fit=crop",
      color: "from-teal-500 to-green-500",
      reverse: true,
    },
  ];

  return (
    <section className="w-full mb-24">
      <div className="max-w-full mx-0 px-4 sm:px-6 lg:px-8">
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
      <section className="w-full bg-gray-50 dark:bg-white">
        <div className="max-w-full mx-0 px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-none overflow-hidden">
            <CardContent className="p-8 sm:p-12 text-center bg-gradient-to-br from-blue-600 to-purple-600">
              <Lightbulb className="h-16 w-16 text-yellow-300 mx-auto mb-6" />

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Built to Help You Succeed at Every Stage
              </h2>

              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Whether you're a first-year student or a seasoned researcher,
                ScholarForge AIadapts to your needs and grows with your academic
                journey.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:bg-gray-50 font-semibold px-8 py-6 btn-glow">
                  <Link href="/signup" className="flex items-center">
                    Start Your Free Trial
                    <Zap className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-6"
                  onClick={() =>
                    window.open(
                      "https://calendly.com/audacityimpact/30min",
                      "_blank",
                    )
                  }>
                  Schedule a Demo
                </Button>
              </div>

              <div className="flex justify-center items-center gap-6 mt-8 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Setup in 2 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Enterprise-grade security</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

// Main Component
const FeaturesDocsPage: React.FC = () => {
  return (
    <div className="w-full">
      <FeaturesPresentationFlow />
      <ClosingCTA />
    </div>
  );
};

export default FeaturesDocsPage;
