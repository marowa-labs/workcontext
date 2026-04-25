"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  FileText,
  MessageCircle,
  Headphones,
  ExternalLink,
  ArrowRight,
  Lightbulb,
  Star,
  Clock,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import Layout from "../../components/Layout";

// Help Hero Section
function HelpHero() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/docs/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="section-padding relative bg-[#121212] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=800&fit=crop')",
        }}></div>

      <div className="absolute inset-0 bg-white/30"></div>

      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-gray-200xl">📚</div>
        <div className="absolute top-40 right-20 text-4xl">🔍</div>
        <div className="absolute bottom-40 left-1/4 text-5xl">💡</div>
        <div className="absolute bottom-20 right-10 text-3xl">🎯</div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Academic Defensibility.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Get Help.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed max-w-3xl mx-auto">
            Get instant answers to your questions about our core functionalities
            and make the most of ScholarForge AI's academic defensibility tools
            with our comprehensive help center.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-200" />
                <Input
                  type="text"
                  placeholder="Search for help articles, features, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg border-2 border-white focus:border-blue-500 rounded-xl shadow-lg bg-white text-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

// Featured Articles
function FeaturedArticles() {
  const articles = [
    {
      icon: Star,
      title: "The Explainable Originality Map",
      description:
        "Understand how our advanced plagiarism detection creates visual maps of your content's originality with detailed similarity reports.",
      readTime: "5 min read",
      category: "Core Functionality",
      path: "/docs/originality-map",
    },
    {
      icon: Lightbulb,
      title: "Submission-Safe Writing Mode",
      description:
        "Learn how our AI detection tools help you write with confidence while ensuring your work remains submission-safe.",
      readTime: "7 min read",
      category: "Core Functionality",
      path: "/docs/ai-detection",
    },
    {
      icon: FileText,
      title: "The Citation Confidence Auditor",
      description:
        "Validate your citations and ensure academic integrity with our comprehensive citation verification tools.",
      readTime: "6 min read",
      category: "Core Functionality",
      path: "/docs/citation-auditor",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Core Functionality Guides
          </h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Find exactly what you're looking for with our organized help topics
            focused on academic defensibility.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <Link
              href={article.path}
              key={index}
              className="block border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
              <Card className="h-full bg-white border border-white">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-blue-900/50">
                      <article.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-blue-400 font-medium">
                      {article.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-gray-200 mb-4 leading-relaxed text-sm">
                    {article.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-200">
                      <Clock className="h-4 w-4" />
                      {article.readTime}
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-200 group-hover:text-blue-400 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Community & Feedback
function CommunityFeedback() {
  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Core Functionality Support
          </h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Need help with our academic defensibility tools? Our community and
            support team are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link
            href="https://discord.gg/2MMSdX3Uee"
            target="_blank"
            rel="noopener noreferrer"
            className="block border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <Card className="bg-white border border-white">
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-green-800 mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Ask the Community
                </h3>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-200 mb-6 leading-relaxed">
                  Connect with fellow students and researchers. Share tips, ask
                  questions, and learn from the ScholarForge AIcommunity.
                </p>
                <Button className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 btn-glow">
                  Join Community Forum
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-sm text-gray-200 mt-3">
                  5,000+ active members ready to help
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link
            href="/docs/contact-support"
            className="block border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <Card className="bg-white border border-white">
              <CardHeader className="text-center pb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 mb-4">
                  <Headphones className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Contact Support
                </h3>
              </CardHeader>
              <CardContent className="text-center px-8 pb-8">
                <p className="text-gray-200 mb-6 leading-relaxed">
                  Get personalized help from our support team. We're here 24/7
                  to ensure your academic success.
                </p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 btn-glow">
                  Send Support Request
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-sm text-gray-200 mt-3">
                  Average response time: 4 hours
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Closing CTA
function ClosingCTA() {
  return (
    <section className="py-16 bg-[#121212]">
      <div className="container-custom">
        <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-500">
          <CardContent className="p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-indigo-900/20"></div>
            <div className="relative z-10">
              <BookOpen className="h-16 w-16 text-blue-400 mx-auto mb-6" />

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Academic Defensibility is Our Mission
              </h2>

              <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto leading-relaxed">
                Every resource in our Help Center is designed with one goal:
                helping you master academic defensibility with our core
                functionalities. Keep exploring, keep learning, keep succeeding.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/docs">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold px-8 py-6 btn-glow">
                    Start Learning
                    <BookOpen className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-500 text-gray-100 hover:bg-gray-500 hover:text-white px-8 py-6">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <p className="text-gray-200 text-sm mt-6">
                Knowledge is power. Make it yours.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

// Documentation Links Section
function DocumentationLinks() {
  const docLinks = [
    {
      title: "Quick Start Guide",
      description: "Get up and running with ScholarForge AIin under 30 minutes",
      path: "/docs/quickstart",
      icon: "⚡",
    },
    {
      title: "Account Setup",
      description:
        "Configure your account for optimal academic writing experience",
      path: "/docs/account-setup",
      icon: "⚙️",
    },
    {
      title: "Account Management",
      description:
        "Control all aspects of your ScholarForge AIaccount settings",
      path: "/docs/account",
      icon: "🔑",
    },
    {
      title: "Profile Settings",
      description: "Manage your personal and academic profile information",
      path: "/docs/profile",
      icon: "👤",
    },
    {
      title: "Installation",
      description:
        "Install ScholarForge AIon any device for seamless academic writing",
      path: "/docs/installation",
      icon: "💻",
    },
    {
      title: "Billing & Plans",
      description: "Understand our pricing plans and manage your subscription",
      path: "/docs/billing",
      icon: "💳",
    },
    {
      title: "Troubleshooting",
      description:
        "Solutions to common issues and problems you might encounter",
      path: "/docs/troubleshooting",
      icon: "🔧",
    },
    {
      title: "Privacy & Security",
      description: "How we protect your data and respect your privacy",
      path: "/docs/privacy",
      icon: "🔒",
    },
    {
      title: "FAQ",
      description: "Find answers to common questions about ScholarForge AI",
      path: "/docs/faq",
      icon: "❓",
    },
    {
      title: "Contact Support",
      description: "Get help from our dedicated support team",
      path: "/docs/contact-support",
      icon: "📞",
    },
    {
      title: "Submission-Safe Writing Mode",
      description:
        "Learn how our AI detection tools ensure your writing remains academically defensible",
      path: "/docs/ai-detection",
      icon: "🤖",
    },
    {
      title: "The Explainable Originality Map",
      description:
        "Comprehensive guide to our advanced plagiarism detection and originality visualization",
      path: "/docs/originality-map",
      icon: "🔍",
    },
    {
      title: "The Citation Confidence Auditor",
      description:
        "Validate citations and ensure academic integrity with our verification tools",
      path: "/docs/citation-auditor",
      icon: "📚",
    },
    {
      title: "Collaboration",
      description:
        "Work together seamlessly with real-time editing and sharing",
      path: "/docs/collaboration",
      icon: "👥",
    },
    {
      title: "Advanced Analytics",
      description: "Track your writing progress and improvement over time",
      path: "/docs/analytics",
      icon: "📊",
    },
    {
      title: "Roadmap",
      description: "See what we're working on and what's coming next",
      path: "/docs/roadmap",
      icon: "🚀",
    },
    {
      title: "Feature Requests",
      description: "Suggest new features and vote on existing requests",
      path: "/docs/feature-request",
      icon: "💡",
    },
    {
      title: "Beta Program",
      description:
        "Get early access to new features and help shape ScholarForge AI",
      path: "/docs/beta-program",
      icon: "⚡",
    },
    {
      title: "The Defensibility Log",
      description:
        "Track and maintain authorship certificates for your academic work",
      path: "/docs/defensibility-log",
      icon: "📋",
    },
    {
      title: "One-Click Publication Suite",
      description:
        "Format and export your work to academic standards with one click",
      path: "/docs/publication-suite",
      icon: "📤",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Core Functionality Documentation
          </h2>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto">
            Dive deeper into ScholarForge AI's academic defensibility tools with
            our detailed documentation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {docLinks.map((docLink, index) => (
            <Link
              key={index}
              href={docLink.path}
              className="block group bg-white border border-white rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start">
                <span className="text-2xl mr-4">{docLink.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {docLink.title}
                  </h3>
                  <p className="text-gray-200 text-sm">{docLink.description}</p>
                </div>
              </div>
              <div className="flex items-center mt-4 text-blue-400 text-sm font-medium">
                Learn more
                <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/docs"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-colors">
            Browse All Documentation
            <BookOpen className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <Layout>
      <HelpHero />
      <FeaturedArticles />
      <DocumentationLinks />
      <CommunityFeedback />
      <ClosingCTA />
    </Layout>
  );
}
