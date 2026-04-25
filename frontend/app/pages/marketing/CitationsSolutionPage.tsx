"use client";

import {
  FileText,
  BookOpen,
  Database,
  CheckCircle,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

// Intro Hero Section
function IntroHero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Ensure Citation Confidence with{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              The Citation Confidence Auditor
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Validate your citations and ensure proper attribution with our
            Citation Confidence Auditor to make your work defensible.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-green-500/20 transition-all duration-300"
              onClick={handleGetStarted}>
              Manage Citations Smarter
            </Button>
            <Button
              size="lg"
              className="bg-white text-gray-200 border border-white hover:bg-white font-semibold px-8 py-6"
              asChild>
              <Link href="/features">See All Features</Link>
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

        <h3 className="text-2xl md:text-3xl font-bold text-gray-600 mb-4">
          {title}
        </h3>

        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div
                className={`w-2 h-2 rounded-full bg-gradient-to-br ${color} mt-2.5 flex-shrink-0`}></div>
              <span className="text-gray-600">{benefit}</span>
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
      icon: BookOpen,
      title: "Confident Citation Generation",
      description:
        "Create perfectly formatted citations from URLs, DOIs, ISBNs, and more with confidence in their accuracy.",
      benefits: [
        "Support for 1000+ citation styles (APA, MLA, Chicago, Harvard, etc.)",
        "Automatic metadata extraction from digital sources",
        "Real-time citation validation and accuracy checks",
        "Cross-platform compatibility with reference managers",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
    },
    {
      icon: LinkIcon,
      title: "Confident In-Text Citation",
      description:
        "Seamlessly insert in-text citations while you write with confidence in their accuracy.",
      benefits: [
        "One-click insertion of in-text citations",
        "Automatic bibliography generation",
        "Dynamic updating when citations change",
        "Real-time validation of citation accuracy",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
      reverse: true,
    },
    {
      icon: Database,
      title: "Citation Confidence Management",
      description:
        "Organize all your sources in one place with validation tools to ensure citation accuracy.",
      benefits: [
        "Unlimited personal reference library",
        "Citation accuracy validation",
        "Full-text search across all references",
        "Import/export from major reference managers",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
    },
    {
      icon: FileText,
      title: "Confident Bibliography",
      description:
        "Generate and format your bibliography automatically with validation for accuracy.",
      benefits: [
        "Automatic sorting by author, date, or title",
        "Duplicate detection and removal",
        "Hanging indent and spacing compliance",
        "Real-time citation validation and accuracy checks",
      ],
      imageUrl:
        "https://nap.nationalacademies.org/books/26613/gif/97.gif?w=800&h=600&fit=crop",
      color: "from-green-600 to-green-800",
      reverse: true,
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

// Closing CTA
function ClosingCTA() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding relative overflow-hidden bg-[#121212]">
      {/* Background with academic shapes */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 to-emerald-900/20 opacity-95"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-green-500/30 rounded-full"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-green-500/30 rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-green-500/30 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 border-2 border-green-500/30 rotate-12"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Ensure Citation Confidence?
          </h2>
          <p className="text-lg text-gray-200 mb-8 leading-relaxed">
            Join thousands of researchers who ensure defensible citations with
            our Citation Confidence Auditor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-green-500/20 transition-all duration-300"
              onClick={handleGetStarted}>
              Start Your Free Trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-gray-200 hover:bg-white backdrop-blur-sm px-8 py-6 text-lg">
              <Link href="/docs/quickstart" className="flex items-center">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-200 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Available worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CitationsSolutionPage() {
  return (
    <Layout>
      <IntroHero />
      <FeaturesPresentationFlow />
      <ClosingCTA />
    </Layout>
  );
}
