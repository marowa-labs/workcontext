"use client";

import { TrendingUp } from "lucide-react";
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
            "url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop')",
        }}></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-6">
            Academic Defensibility Success Stories with{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              ScholarForge AI
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Discover how students, researchers, and academic institutions are
            enhancing academic defensibility and achieving better outcomes with
            our core tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6"
              onClick={handleGetStarted}>
              Start Your Success Story
            </Button>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 font-semibold px-8 py-6 border border-white"
              asChild>
              <Link href="/features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Case Study Card Component
interface CaseStudyCardProps {
  id: string;
  title: string;
  institution: string;
  excerpt: string;
  imageUrl: string;
  results: string[];
}

function CaseStudyCard({
  id,
  title,
  institution,
  excerpt,
  imageUrl,
  results,
}: CaseStudyCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-white">
      <div className="relative h-48 overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>

      <div className="p-6">
        <div className="inline-block px-3 py-1 text-xs font-semibold text-blue-400 bg-blue-900/30 rounded-full mb-3">
          {institution}
        </div>

        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

        <p className="text-gray-200 mb-4">{excerpt}</p>

        <div className="space-y-2 mb-6">
          {results.map((result, index) => (
            <div key={index} className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-sm text-gray-200">{result}</span>
            </div>
          ))}
        </div>

        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 btn-glow font-semibold px-4 py-2"
          asChild>
          <Link href={`/resources/case-studies/${id}`}>Read Full Story</Link>
        </Button>
      </div>
    </div>
  );
}

// Case Studies Grid
function CaseStudiesGrid() {
  // Sample case studies data - in a real app this would come from an API
  const caseStudies = [
    {
      id: "originality-map-implementation",
      title: "Enhanced Originality Detection",
      institution: "Stanford University",
      excerpt:
        "How a research team improved their originality verification process using ScholarForge AI's Explainable Originality Map.",
      imageUrl:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop",
      results: [
        "95% improvement in originality verification",
        "40% reduction in citation errors",
        "Enhanced confidence in academic integrity",
      ],
    },
    {
      id: "citation-auditor-success",
      title: "Citation Confidence Verification",
      institution: "MIT",
      excerpt:
        "A graduate student validated 500+ citations with 99% accuracy using ScholarForge AI's Citation Confidence Auditor.",
      imageUrl:
        "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=800&h=600&fit=crop",
      results: [
        "99% citation accuracy achieved",
        "80% time reduction in citation verification",
        "Zero citation-related corrections",
      ],
    },
    {
      id: "ai-detection-implementation",
      title: "Submission-Safe Writing",
      institution: "University of Oxford",
      excerpt:
        "Implementation of AI detection tools led to 100% submission-ready documents with enhanced authenticity.",
      imageUrl:
        "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=600&fit=crop",
      results: [
        "100% submission-ready documents",
        "Enhanced AI humanization",
        "Improved writing authenticity",
      ],
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Academic Defensibility Case Studies
          </h2>
          <p className="text-lg text-gray-200">
            Real results from real users demonstrating academic defensibility
            across various institutions and research fields.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.id} {...study} />
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
            Ready to Enhance Your Academic Defensibility?
          </h2>
          <p className="text-lg text-gray-200 mb-8">
            Join thousands of academics who are already enhancing their
            defensibility outcomes with ScholarForge AI.
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

export default function CaseStudiesPage() {
  return (
    <Layout>
      <IntroHero />
      <CaseStudiesGrid />
      <ClosingCTA />
    </Layout>
  );
}
