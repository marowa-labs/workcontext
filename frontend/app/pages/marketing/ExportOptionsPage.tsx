"use client";

import {
  Download,
  FileText,
  HardDrive,
  Cloud,
  CheckCircle,
  FileSpreadsheet,
  Image,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

function IntroHero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding bg-[#121212] relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=800&fit=crop')",
        }}
      ></div>
      <div className="container-custom relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Export Your Work, Your Way
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Export your documents to any format you need — PDF, DOCX, LaTeX, RTF,
            TXT, XLSX, CSV, or PNG. Publish directly to Google Drive or OneDrive
            with journal-ready templates and academic citation support.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-teal-500/20 transition-all duration-300"
              onClick={handleGetStarted}
            >
              Start Exporting
            </Button>
            <Button
              size="lg"
              className="bg-white text-gray-600 border border-white hover:bg-white font-semibold px-8 py-6"
              asChild
            >
              <Link href="/features">See All Features</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

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
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}
    >
      <div className={reverse ? "lg:col-start-2" : ""}>
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${color} mb-6`}
        >
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
                className={`w-2 h-2 rounded-full bg-gradient-to-br ${color} mt-2.5 flex-shrink-0`}
              ></div>
              <span className="text-gray-600">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

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

function FeaturesPresentationFlow() {
  const features = [
    {
      icon: FileText,
      title: "Full Format Coverage",
      description:
        "Export to every major document format: PDF for print-ready publishing, DOCX for Microsoft Word compatibility, LaTeX for scientific publishing, RTF for rich text, and TXT for plain text — all from a single click.",
      benefits: [
        "PDF: print-ready documents with embedded fonts and images",
        "DOCX: fully editable Microsoft Word files",
        "LaTeX: scientific document format with journal templates",
        "RTF and TXT: lightweight rich text and plain text formats",
      ],
      imageUrl:
        "https://image2url.com/images/1766035336823-26557e0e-2275-4c00-a32b-3ceaf5ded69e.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
    },
    {
      icon: FileSpreadsheet,
      title: "Spreadsheet & Image Export",
      description:
        "Beyond documents: export data as XLSX spreadsheets or CSV for database compatibility. Export document pages as PNG images for presentations, thumbnails, or embedding.",
      benefits: [
        "XLSX: structured spreadsheet export with formatting",
        "CSV: plain-text tabular data for databases and analysis",
        "PNG: export document as high-resolution images",
        "All formats maintain consistent styling and layout",
      ],
      imageUrl:
        "https://image2url.com/images/1766035320251-310899dc-370b-436c-a767-cc4dea99c875.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
      reverse: true,
    },
    {
      icon: Cloud,
      title: "Cloud Storage Export",
      description:
        "Save directly to your cloud accounts. Export to Google Drive or OneDrive with a single click — no manual download and re-upload needed.",
      benefits: [
        "Direct export to Google Drive",
        "Direct export to Microsoft OneDrive",
        "Cloud files stay organized in your existing folder structure",
        "Perfect for team sharing and backup workflows",
      ],
      imageUrl:
        "https://image2url.com/images/1766036205468-a4df49e1-70f7-4c46-b0ea-7bedc8405f9f.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
    },
    {
      icon: BookOpen,
      title: "Academic & Journal Publishing",
      description:
        "Publish with confidence using journal-ready templates and professional citation support. Choose from IEEE, Nature, Science, and APA Journal formats with APA, MLA, or Chicago citation styles.",
      benefits: [
        "Journal templates: IEEE, Nature, Science, APA Journal",
        "Citation styles: APA 7th, MLA 9th, Chicago 17th editions",
        "Pre-export document audit: word count, heading structure, issues",
        "Publication-ready formatting with cover page and table of contents",
      ],
      imageUrl:
        "https://image2url.com/images/1766035312459-98d7648e-94de-43de-8e51-c1d98680ce12.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
      reverse: true,
    },
    {
      icon: Download,
      title: "Project & Batch Export",
      description:
        "Export entire projects or batch-select multiple documents for efficient delivery. All exports go through a pre-flight audit that checks structure, word count, and potential issues.",
      benefits: [
        "Batch export multiple documents at once",
        "Pre-export structural audit with issues summary",
        "Consistent formatting across all exported documents",
        "Custom metadata: author, institution, course, instructor, running head",
      ],
      imageUrl:
        "https://image2url.com/images/1766041414714-d21fc2eb-7026-4d37-9bb7-2c564aed93ab.png?w=800&h=600&fit=crop",
      color: "from-teal-600 to-teal-800",
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

function ClosingCTA() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section className="section-padding relative overflow-hidden bg-[#121212]">
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
            Ready to Export Your Work?
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Join thousands of professionals and teams who rely on our export
            tools for flawless, professional document formatting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold px-8 py-6 shadow-lg hover:shadow-teal-500/20 transition-all duration-300"
              onClick={handleGetStarted}
            >
              Start Your Free Trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-gray-600 hover:bg-gray-600 backdrop-blur-sm px-8 py-6 text-lg"
            >
              <Link href="/docs/quickstart" className="flex items-center">
                See How It Works
              </Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-gray-600 text-sm">
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
