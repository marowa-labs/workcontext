"use client";

import {
  Download,
  FileText,
  HardDrive,
  Cloud,
  CheckCircle,
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
            "url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Publish Your Work Defensibly with{" "}
            <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              The One-Click Publication Suite
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Your defensible work, ready for publication. Export to any format
            needed for submission with our One-Click Publication Suite that
            ensures proper formatting and compliance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-teal-500/20 transition-all duration-300"
              onClick={handleGetStarted}>
              Start Exporting
            </Button>
            <Button
              size="lg"
              className="bg-white text-gray-600 border border-white hover:bg-white font-semibold px-8 py-6"
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
      icon: FileText,
      title: "One-Click Format Conversion",
      description:
        "Export your documents to any format required for submission with one click using our Publication Suite.",
      benefits: [
        "Export to Word, PDF, LaTeX, and plain text",
        "Maintain formatting across all formats",
        "Custom export templates for institutions",
        "One-click publication formatting",
      ],
      imageUrl:
        "https://image2url.com/images/1766035336823-26557e0e-2275-4c00-a32b-3ceaf5ded69e.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
    },
    {
      icon: Cloud,
      title: "Publication Integration",
      description:
        "Seamlessly export directly to academic platforms and repositories with proper citation formatting.",
      benefits: [
        "Direct integration with academic repositories",
        "One-click export to journal platforms",
        "Sync with citation managers for proper attribution",
        "Automatic defensibility certificate generation",
      ],
      imageUrl:
        "https://image2url.com/images/1766035320251-310899dc-370b-436c-a767-cc4dea99c875.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
      reverse: true,
    },
    {
      icon: HardDrive,
      title: "Defensible Formatting",
      description:
        "Apply custom formatting rules that ensure compliance with institutional requirements and defensibility standards.",
      benefits: [
        "Template library for major universities",
        "Compliance formatting for defensibility",
        "Header/footer customization",
        "Citation and reference formatting",
      ],
      imageUrl:
        "https://image2url.com/images/1766036205468-a4df49e1-70f7-4c46-b0ea-7bedc8405f9f.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
    },
    {
      icon: Download,
      title: "One-Click Publication",
      description:
        "Save time with one-click publication capabilities that ensure your work is properly formatted and defensible.",
      benefits: [
        "Export entire projects with one click",
        "Consistent defensible formatting across all documents",
        "Automated compliance checking",
        "Publication certificate generation",
      ],
      imageUrl:
        "https://image2url.com/images/1766035312459-98d7648e-94de-43de-8e51-c1d98680ce12.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
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
      <div className="absolute inset-0 bg-gradient-to-r from-teal-900/20 to-cyan-900/20 opacity-95"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-teal-500/30 rounded-full"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-teal-500/30 rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-teal-500/30 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 border-2 border-teal-500/30 rotate-12"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Publish with Academic Defensibility?
          </h2>
          <p className="text-lg text-gray-200 mb-8 leading-relaxed">
            Join thousands of academics who trust our One-Click Publication
            Suite for flawless, defensible document formatting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-teal-500/20 transition-all duration-300"
              onClick={handleGetStarted}>
              Start Your Free Trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-gray-200 hover:bg-gray-600 backdrop-blur-sm px-8 py-6 text-lg">
              <Link href="/docs/quickstart" className="flex items-center">
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-200 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-400" />
              <span>Available worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ExportOptionsPage() {
  return (
    <Layout>
      <IntroHero />
      <FeaturesPresentationFlow />
      <ClosingCTA />
    </Layout>
  );
}
