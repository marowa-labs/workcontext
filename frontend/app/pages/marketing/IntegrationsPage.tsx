"use client";

import { Cloud, Database, GitBranch, Shield, CheckCircle } from "lucide-react";
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
            "url('https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Academic Defensibility Integrations for Your{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Research Workflow
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Connect ScholarForge AIwith your favorite tools and services to
            create a unified academic environment that enhances your research
            defensibility, writing integrity, and collaboration processes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6"
              onClick={handleGetStarted}>
              Explore Integrations
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 font-semibold px-8 py-6 btn-glow border border-white"
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
  features: string[];
  imageUrl: string;
  reverse?: boolean;
  color: string;
}

function FeatureDetail({
  icon: Icon,
  title,
  description,
  features,
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
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-gray-200">{feature}</span>
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

// Integrations Presentation Flow
function IntegrationsPresentationFlow() {
  const integrations = [
    {
      icon: Shield,
      title: "The Explainable Originality Map",
      description:
        "Connect with academic databases and repositories to enhance originality detection.",
      features: [
        "CrossRef integration for DOI-based originality checks",
        "arXiv repository connectivity for preprint verification",
        "PubMed Central integration for medical research validation",
        "IEEE Xplore connectivity for technical paper verification",
      ],
      imageUrl:
        "https://image2url.com/images/1766043763972-7cb3f4c1-17e9-4c29-89ee-b2ea72344ca6.png?w=800&h=600&fit=crop",
      color: "from-blue-600 to-blue-800",
    },
    {
      icon: Database,
      title: "The Citation Confidence Auditor",
      description:
        "Integrate with reference managers to enhance citation verification.",
      features: [
        "Zotero synchronization for citation accuracy verification",
        "Mendeley integration for comprehensive bibliography validation",
        "EndNote compatibility for advanced citation format checks",
        "Automatic citation confidence scoring across all documents",
      ],
      imageUrl:
        "https://image2url.com/images/1766043763972-7cb3f4c1-17e9-4c29-89ee-b2ea72344ca6.png?w=800&h=600&fit=crop",
      color: "from-indigo-600 to-indigo-800",
      reverse: true,
    },
    {
      icon: Cloud,
      title: "Submission-Safe Writing Mode",
      description:
        "Connect with AI detection services to enhance writing safety.",
      features: [
        "OpenAI Content Policy integration for AI detection",
        "GPTZero connectivity for advanced AI writing detection",
        "Writer.com integration for content authenticity verification",
        "Automatic humanization recommendations across documents",
      ],
      imageUrl:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop",
      color: "from-purple-600 to-purple-800",
    },
    {
      icon: GitBranch,
      title: "The Defensibility Log",
      description:
        "Connect with version control systems to track defensibility.",
      features: [
        "GitHub integration for authorship tracking",
        "GitLab connectivity for collaboration defensibility",
        "Bitbucket support for version-based authorship logs",
        "Automatic defensibility certificate generation for changes",
      ],
      imageUrl:
        "https://cdn.prod.website-files.com/61845f7929f5aa517ebab941/63a06f726c26c8dda5deba70_The%20Battle%20of%20Authentication-%20Which%20Type%20Is%20Most%20Secure.jpg?w=800&h=600&fit=crop",
      color: "from-pink-600 to-pink-800",
      reverse: true,
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="space-y-24">
          {integrations.map((integration, index) => (
            <FeatureDetail key={index} {...integration} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Integration Categories
function IntegrationCategories() {
  const categories = [
    {
      title: "Originality Verification",
      count: "8 integrations",
      integrations: ["CrossRef", "arXiv", "PubMed Central", "IEEE Xplore"],
    },
    {
      title: "Citation Validation",
      count: "6 integrations",
      integrations: ["Zotero", "Mendeley", "EndNote", "JSTOR"],
    },
    {
      title: "AI Detection",
      count: "5 integrations",
      integrations: [
        "OpenAI Content Policy",
        "GPTZero",
        "Writer.com",
        "Originality.ai",
      ],
    },
    {
      title: "Authorship Tracking",
      count: "4 integrations",
      integrations: ["GitHub", "GitLab", "Bitbucket", "Subversion"],
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Academic Defensibility Integration Ecosystem
          </h2>
          <p className="text-lg text-gray-200">
            Connect with the tools you already use to enhance your academic
            defensibility workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg border border-white">
              <h3 className="text-xl font-bold text-white mb-2">
                {category.title}
              </h3>
              <p className="text-gray-200 text-sm mb-4">{category.count}</p>
              <ul className="space-y-2">
                {category.integrations.map((integration, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-200 text-sm">{integration}</span>
                  </li>
                ))}
              </ul>
            </div>
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
    <section className="section-padding bg-[#121212] relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-indigo-900/30"></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Enhance Academic Defensibility?
          </h2>
          <p className="text-lg text-gray-200 mb-8">
            Join thousands of academics who have enhanced their defensibility
            workflow with our integrations.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold px-8 py-6 btn-glow"
            onClick={handleGetStarted}>
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function IntegrationsPage() {
  return (
    <Layout>
      <IntroHero />
      <IntegrationsPresentationFlow />
      <IntegrationCategories />
      <ClosingCTA />
    </Layout>
  );
}
