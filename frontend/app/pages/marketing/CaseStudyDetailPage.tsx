"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

// Mock data for case studies - in a real app this would come from an API
const CASE_STUDIES_DATA = {
  "originality-map-implementation": {
    id: "originality-map-implementation",
    title: "Enhanced Originality Detection at Stanford University",
    institution: "Stanford University",
    author: "Dr. Sarah Johnson",
    date: "March 15, 2024",
    readTime: "8 min read",
    category: "Defensibility",
    imageUrl:
      "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&h=600&fit=crop",
    overview:
      "Stanford University's Department of Computer Science implemented ScholarForge AI's Explainable Originality Map across their research teams to enhance academic defensibility. The department saw significant improvements in originality verification and citation accuracy.",
    challenge:
      "The research team at Stanford University was facing challenges with verifying the originality of their research content and ensuring proper attribution. Their existing workflow lacked visual tools to understand similarity patterns and source attribution.",
    solution:
      "The department implemented ScholarForge AI's Explainable Originality Map, integrating it with their research workflow. This provided visual representations of content originality with detailed similarity reports and source attribution.",
    results: [
      {
        metric: "Originality Verification",
        value: "95% improvement",
        description:
          "Enhanced ability to identify and address potential originality issues before submission",
      },
      {
        metric: "Citation Accuracy",
        value: "40% improvement",
        description:
          "Better identification of sources requiring proper citation",
      },
      {
        metric: "Academic Confidence",
        value: "100%",
        description:
          "Researchers gained complete confidence in their work's defensibility",
      },
    ],
    testimonial: {
      quote:
        "ScholarForge AI's Explainable Originality Map transformed how we verify our research defensibility. The visual tools give us confidence that our work meets the highest academic standards.",
      author: "Dr. Sarah Johnson",
      title: "Head of Research, Stanford University",
    },
    detailedResults: [
      "Implemented across 15 research teams with 120+ researchers",
      "Achieved 95% improvement in originality verification",
      "Reduced citation errors by 40%",
      "Enhanced researcher confidence in academic defensibility",
      "Improved collaboration on originality verification",
      "Achieved 100% compliance with academic integrity standards",
    ],
  },
  "citation-auditor-success": {
    id: "citation-auditor-success",
    title: "Citation Confidence Verification at MIT",
    institution: "MIT",
    author: "Prof. Michael Chen",
    date: "January 28, 2024",
    readTime: "6 min read",
    category: "Defensibility",
    imageUrl:
      "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=1200&h=600&fit=crop",
    overview:
      "A graduate student at MIT validated 500+ citations with 99% accuracy using ScholarForge AI's Citation Confidence Auditor, ensuring complete academic defensibility.",
    challenge:
      "Graduate students at MIT often struggle with citation verification, particularly ensuring that their citations are accurate, properly formatted, and that they accurately represent the original sources throughout the lengthy writing process.",
    solution:
      "The student utilized ScholarForge AI's Citation Confidence Auditor to validate citations, cross-referencing them against authoritative databases and confirming that citations accurately represent the original content.",
    results: [
      {
        metric: "Citation Accuracy",
        value: "99% achieved",
        description: "Validated 500+ citations with 99% accuracy",
      },
      {
        metric: "Verification Time",
        value: "80% reduction",
        description:
          "Significant reduction in time spent on citation verification",
      },
      {
        metric: "Citation Errors",
        value: "Zero",
        description: "Zero citation-related corrections needed",
      },
    ],
    testimonial: {
      quote:
        "I couldn't have validated my citations so thoroughly without ScholarForge AI's Citation Confidence Auditor. The verification tools gave me confidence that my work met the highest academic standards.",
      author: "Emily Rodriguez",
      title: "PhD Candidate, MIT",
    },
    detailedResults: [
      "Validated 500+ citations with 99% accuracy",
      "Achieved 80% time reduction in citation verification",
      "Zero citation-related corrections",
      "Enhanced confidence in citation accuracy",
      "Received positive feedback from thesis committee on citation quality",
      "Published research findings with verified citations",
    ],
  },
  "ai-detection-implementation": {
    id: "ai-detection-implementation",
    title: "Submission-Safe Writing at University of Oxford",
    institution: "University of Oxford",
    author: "Dr. James Wilson",
    date: "February 10, 2024",
    readTime: "7 min read",
    category: "Defensibility",
    imageUrl:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200&h=600&fit=crop",
    overview:
      "University of Oxford implemented ScholarForge AI's Submission-Safe Writing Mode across departments to ensure academic defensibility, resulting in 100% submission-ready documents with enhanced authenticity.",
    challenge:
      "The university was experiencing challenges with ensuring that student submissions were authentic and AI-free, particularly with the rise of AI writing tools that threatened academic integrity.",
    solution:
      "Oxford deployed ScholarForge AI's Submission-Safe Writing Mode across all academic departments, providing students with real-time AI detection feedback and humanization suggestions to ensure authentic writing.",
    results: [
      {
        metric: "Submission Readiness",
        value: "100%",
        description:
          "All documents were submission-ready with proper authenticity",
      },
      {
        metric: "AI Detection",
        value: "Enhanced",
        description:
          "Improved ability to detect and humanize AI-generated content",
      },
      {
        metric: "Writing Authenticity",
        value: "Improved",
        description: "Enhanced writing authenticity and originality",
      },
    ],
    testimonial: {
      quote:
        "ScholarForge AI's Submission-Safe Writing Mode has been instrumental in helping our students maintain authentic writing. The real-time AI feedback has been particularly valuable.",
      author: "Dr. James Wilson",
      title: "Director of Academic Defensibility, University of Oxford",
    },
    detailedResults: [
      "Achieved 100% submission-ready documents",
      "Enhanced AI detection capabilities",
      "Improved writing authenticity",
      "Increased faculty confidence in student work",
      "Reduced time spent by faculty on authenticity verification",
      "Enhanced student understanding of authentic writing",
    ],
  },
};

// Feature Detail Component for alternating layout
interface FeatureDetailProps {
  title: string;
  description: string;
  imageUrl: string;
  reverse?: boolean;
  color: string;
}

function FeatureDetail({
  title,
  description,
  imageUrl,
  reverse = false,
  color,
}: FeatureDetailProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}>
      {/* Content */}
      <div className={reverse ? "lg:col-start-2" : ""}>
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          {title}
        </h3>

        <p className="text-lg text-gray-200 mb-6 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Image */}
      <div className={reverse ? "lg:col-start-1" : ""}>
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="rounded-2xl shadow-2xl w-full"
          />
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-tr ${color}`}></div>
        </div>
      </div>
    </div>
  );
}

// Results Section
function ResultsSection({ results }: { results: any[] }) {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Measurable Results
          </h2>
          <p className="text-lg text-gray-200">
            Quantifiable improvements achieved through the implementation of
            ScholarForge AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg text-center border border-white">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {result.value}
              </h3>
              <h4 className="text-lg font-semibold text-white mb-3">
                {result.metric}
              </h4>
              <p className="text-gray-200">{result.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonial Section
function TestimonialSection({ testimonial }: { testimonial: any }) {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-3xl p-8 md:p-12 text-center border border-white">
            <QuoteIcon className="h-12 w-12 text-white/30 mx-auto mb-6" />
            <blockquote className="text-xl md:text-2xl text-white font-medium mb-8 leading-relaxed">
              "{testimonial.quote}"
            </blockquote>
            <div className="flex flex-col items-center">
              <div className="font-bold text-white text-lg">
                {testimonial.author}
              </div>
              <div className="text-gray-200">{testimonial.title}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Detailed Results List
function DetailedResults({ results }: { results: string[] }) {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">
            Implementation Details
          </h2>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-green-900/50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <p className="text-gray-200">{result}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Quote Icon Component
function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
    </svg>
  );
}

// Header Section
function HeaderSection({ caseStudy }: { caseStudy: any }) {
  return (
    <section className="section-padding bg-[#121212]">
      <div className="container-custom">
        <Button
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 btn-glow mb-6 pl-2"
          asChild>
          <Link href="/resources/case-studies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Case Studies
          </Link>
        </Button>

        <div className="max-w-4xl">
          <div className="inline-block px-3 py-1 text-xs font-semibold text-blue-400 bg-blue-900/30 rounded-full mb-4">
            {caseStudy.category}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {caseStudy.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-gray-200 mb-8">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{caseStudy.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{caseStudy.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{caseStudy.readTime}</span>
            </div>
          </div>

          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            {caseStudy.overview}
          </p>

          <div className="flex flex-wrap gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 btn-glow">
              <Bookmark className="h-4 w-4 mr-2" />
              Save Case Study
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Image Section
function ImageSection({
  imageUrl,
  title,
}: {
  imageUrl: string;
  title: string;
}) {
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="rounded-2xl overflow-hidden shadow-2xl">
          <img src={imageUrl} alt={title} className="w-full h-auto" />
        </div>
      </div>
    </section>
  );
}

export default function CaseStudyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [caseStudy, setCaseStudy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      const study = CASE_STUDIES_DATA[id as keyof typeof CASE_STUDIES_DATA];
      if (study) {
        setCaseStudy(study);
      } else {
        // Navigate to 404 page if case study not found
        router.push("/404");
      }
      setLoading(false);
    }, 500);
  }, [id, router]);

  if (loading) {
    return (
      <Layout>
        <div className="section-padding bg-white">
          <div className="container-custom">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!caseStudy) {
    return (
      <Layout>
        <div className="section-padding bg-white">
          <div className="container-custom">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-4">
                Case Study Not Found
              </h1>
              <p className="text-gray-200 mb-8">
                The requested case study could not be found.
              </p>
              <Button asChild>
                <Link href="/resources/case-studies">Back to Case Studies</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <HeaderSection caseStudy={caseStudy} />
      <ImageSection imageUrl={caseStudy.imageUrl} title={caseStudy.title} />
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto space-y-24">
            <FeatureDetail
              title="The Challenge"
              description={caseStudy.challenge}
              imageUrl="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop"
              color="from-red-500/10 to-orange-500/10"
            />
            <FeatureDetail
              title="Our Solution"
              description={caseStudy.solution}
              imageUrl="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop"
              color="from-blue-500/10 to-indigo-500/10"
              reverse
            />
          </div>
        </div>
      </section>
      <ResultsSection results={caseStudy.results} />
      <TestimonialSection testimonial={caseStudy.testimonial} />
      <DetailedResults results={caseStudy.detailedResults} />

      <section className="section-padding bg-[#121212] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-indigo-900/30"></div>
        <div className="container-custom relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Enhance Your Academic Defensibility?
            </h2>
            <p className="text-lg text-gray-200 mb-8">
              Join thousands of academic institutions and researchers who are
              enhancing their defensibility outcomes with ScholarForge AI.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 font-semibold px-8 py-6 btn-glow"
              onClick={() => router.push("/signup")}>
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
