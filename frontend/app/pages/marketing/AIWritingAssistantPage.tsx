"use client";

import { Bot, PenTool, SpellCheck, Lightbulb, CheckCircle } from "lucide-react";
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
            "url('https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Write with Academic Defensibility using{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI-Powered Assistance
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Get intelligent, contextual suggestions that ensure your work is
            original, properly cited, and defensible with our five core
            functionalities: The Explainable Originality Map, Citation
            Confidence Auditor, Submission-Safe Writing Mode, Defensibility Log,
            and One-Click Publication Suite.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
              onClick={handleGetStarted}>
              Start Writing Smarter
            </Button>
            <Button
              size="lg"
              className="bg-white text-gray-600 border border-white hover:bg-white font-semibold px-8 py-6"
              asChild>
              <Link href="/features">Explore Features</Link>
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

        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
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
      icon: PenTool,
      title: "Submission-Safe Writing Mode",
      description:
        "Receive intelligent suggestions that help ensure your writing is original and defensible with our AI detection and humanizing capabilities.",
      benefits: [
        "Real-time AI detection and humanizing suggestions",
        "Context-aware vocabulary suggestions",
        "Academic tone and clarity improvements",
        "Sentence structure optimization",
      ],
      imageUrl:
        "https://image2url.com/images/1766041152077-b4c17420-fe8e-4b9c-9c7c-dd9b7c022d9c.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
    },
    {
      icon: SpellCheck,
      title: "The Explainable Originality Map",
      description:
        "Identify and address potential plagiarism issues with our comprehensive originality mapping system.",
      benefits: [
        "Real-time plagiarism detection with detailed reports",
        "Visual mapping of content similarities",
        "Detailed source attribution",
        "Comprehensive originality scoring",
      ],
      imageUrl:
        "https://image2url.com/images/1766041153329-020b1a54-2b68-4606-b68b-7db5fda21e14.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
      reverse: true,
    },
    {
      icon: Lightbulb,
      title: "The Citation Confidence Auditor",
      description:
        "Validate your citations and ensure proper attribution with our comprehensive citation auditing system.",
      benefits: [
        "Real-time citation validation",
        "Reference accuracy checking",
        "Bibliography verification",
        "Citation format compliance",
      ],
      imageUrl:
        "https://image2url.com/images/1766041154551-efe0d071-68f1-4ded-be3a-fe39a16514fc.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
    },
    {
      icon: Bot,
      title: "The Defensibility Log & One-Click Publication Suite",
      description:
        "Track your authorship and prepare your work for publication with our comprehensive defensibility tools.",
      benefits: [
        "Authorship certificate generation",
        "Defensibility log tracking",
        "Automated publication formatting",
        "One-click export to multiple formats",
      ],
      imageUrl:
        "https://www.frontiersin.org/files/Articles/1596462/feduc-10-1596462-HTML/image_m/feduc-10-1596462-g001.jpg?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
      reverse: true,
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="space-y-24 text-gray-600">
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
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/20 to-purple-900/20 opacity-95"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-indigo-500/30 rounded-full"></div>
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-indigo-500/30 rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 border-2 border-indigo-500/30 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 border-2 border-indigo-500/30 rotate-12"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Ensure Academic Defensibility?
          </h2>
          <p className="text-lg text-gray-200 mb-8 leading-relaxed">
            Join thousands of students and researchers who are already writing
            with confidence using our five core functionalities: The Explainable
            Originality Map, Citation Confidence Auditor, Submission-Safe
            Writing Mode, Defensibility Log, and One-Click Publication Suite.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-indigo-500/20 transition-all duration-300"
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
              <CheckCircle className="h-4 w-4 text-indigo-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-indigo-400" />
              <span>Available worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AIWritingAssistantPage() {
  return (
    <Layout>
      <IntroHero />
      <FeaturesPresentationFlow />
      <ClosingCTA />
    </Layout>
  );
}
