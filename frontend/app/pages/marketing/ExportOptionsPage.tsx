"use client";

import {
  Download,
  FileText,
  Cloud,
  CheckCircle,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import AuraObject3DEmber from "../../components/AuraObject3DEmber";

// ─── Aura Design Tokens (Ember / warm variant) ──────────────────────────────
const ACCENT = "#fb923c";
const ACCENT_GLOW = "rgba(251, 146, 60, 0.45)";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// ─── Reveal Variants ────────────────────────────────────────────────────────
const reveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE, delay: i * 0.12 },
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// Intro Hero — editorial left-aligned with the ember ring centerpiece
// ═══════════════════════════════════════════════════════════════════════════════
function IntroHero() {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const handleGetStarted = () => {
    router.push("/signup");
  };

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center overflow-hidden bg-[#111111]"
    >
      {/* 3D centerpiece */}
      <div className="absolute inset-0 z-0">
        <AuraObject3DEmber />
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(17,17,17,0.35)_0%,rgba(17,17,17,0.85)_70%,#111111_100%)]" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#111111]/60 via-transparent to-[#111111]" />

      <motion.div
        style={
          reduceMotion ? undefined : { y: contentY, opacity: contentOpacity }
        }
        className="relative z-10 container-custom grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-24 lg:py-0"
      >
        {/* Left: editorial copy */}
        <div className="text-left">
          <motion.p
            custom={0}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="text-xs uppercase tracking-[0.35em] text-[#fb923c] mb-6"
          >
            Export Options
          </motion.p>

          <motion.h1
            custom={1}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f4f4f2] mb-6 leading-[1.05]"
          >
            Export Your Work, <span className="text-[#fb923c]">Your Way</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="text-lg text-[rgba(244,244,242,0.55)] mb-8 leading-relaxed max-w-xl"
          >
            Export your documents to any format you need — PDF, DOCX, LaTeX,
            RTF, TXT, XLSX, CSV, or PNG. Publish directly to Google Drive or
            OneDrive with journal-ready templates and academic citation support.
          </motion.p>

          <motion.div
            custom={3}
            variants={reveal}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="rounded-none bg-[#fb923c] text-[#0b0b0b] hover:bg-[#fdba74] font-semibold px-8 py-6 transition-all duration-300"
              onClick={handleGetStarted}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT_GLOW}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Start Exporting
            </Button>
            <Button
              size="lg"
              className="rounded-none border border-[rgba(255,255,255,0.16)] text-[#f4f4f2] bg-white/[0.03] hover:bg-white/[0.08] font-semibold px-8 py-6"
              asChild
            >
              <Link href="/features">See All Features</Link>
            </Button>
          </motion.div>
        </div>

        {/* Right: ghost outline title for depth */}
        <div className="hidden lg:block relative h-[420px]">
          <h1
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[6.5rem] font-bold text-transparent whitespace-nowrap select-none pointer-events-none"
            style={{ WebkitTextStroke: "1px rgba(251,146,60,0.14)" }}
          >
            EXPORT
          </h1>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] uppercase tracking-[0.35em] text-[rgba(244,244,242,0.32)]">
          Scroll
        </span>
        <div className="w-px h-12 bg-[rgba(255,255,255,0.08)] relative overflow-hidden">
          <motion.div
            animate={{ y: [-48, 48] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-transparent via-[#fb923c] to-transparent"
          />
        </div>
      </motion.div>
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
}

function ParallaxImage({ imageUrl, alt }: { imageUrl: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className="relative overflow-hidden">
      <motion.img
        src={imageUrl}
        alt={alt}
        style={reduceMotion ? undefined : { y }}
        className="w-full scale-[1.15]"
      />
    </div>
  );
}

function FeatureDetail({
  icon: Icon,
  title,
  description,
  benefits,
  imageUrl,
  reverse = false,
}: FeatureDetailProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${reverse ? "lg:grid-flow-col-dense" : ""}`}
    >
      <motion.div
        custom={0}
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className={reverse ? "lg:col-start-2" : ""}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-none border border-[rgba(255,255,255,0.08)] bg-[#171717] mb-6">
          <Icon className="h-8 w-8 text-[#fb923c]" />
        </div>

        <h3 className="text-2xl md:text-3xl font-bold text-[#f4f4f2] mb-4">
          {title}
        </h3>

        <p className="text-lg text-[rgba(244,244,242,0.55)] mb-6 leading-relaxed">
          {description}
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-[#fb923c] mt-2.5 flex-shrink-0"></div>
              <span className="text-[rgba(244,244,242,0.55)]">{benefit}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        custom={1}
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className={reverse ? "lg:col-start-1" : ""}
      >
        <div className="relative border border-[rgba(255,255,255,0.08)] bg-[#171717] p-2">
          <div className="h-px bg-gradient-to-r from-transparent via-[#fb923c]/60 to-transparent absolute top-0 left-0 right-0"></div>
          <ParallaxImage imageUrl={imageUrl} alt={title} />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>
        </div>
      </motion.div>
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
    },
  ];

  return (
    <section className="section-padding bg-[#0b0b0b] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#fb923c]/[0.05] blur-3xl pointer-events-none" />

      <div className="container-custom relative">
        <motion.div
          custom={0}
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[#fb923c] mb-4">
            Formats
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-6">
            Every Format, One Click
          </h2>
          <p className="text-lg text-[rgba(244,244,242,0.55)] leading-relaxed">
            From print-ready PDFs to cloud delivery — five deeply integrated
            export capabilities working together in one seamless flow.
          </p>
        </motion.div>

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
    <section className="section-padding relative overflow-hidden bg-[#111111]">
      {/* Glow blobs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#fb923c]/[0.06] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#fb923c]/[0.04] blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        <motion.div
          custom={0}
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center max-w-3xl mx-auto"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-[#fb923c] mb-4">
            Get Started
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#f4f4f2] mb-6">
            Ready to Export Your Work?
          </h2>
          <p className="text-lg text-[rgba(244,244,242,0.55)] mb-8 leading-relaxed">
            Join thousands of professionals and teams who rely on our export
            tools for flawless, professional document formatting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="rounded-none bg-[#fb923c] text-[#0b0b0b] hover:bg-[#fdba74] font-semibold px-8 py-6 transition-all duration-300"
              onClick={handleGetStarted}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 0 40px ${ACCENT_GLOW}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Start Your Free Trial
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-none border-[rgba(255,255,255,0.16)] text-[#f4f4f2] bg-white/[0.03] hover:bg-white/[0.08] px-8 py-6 text-lg"
            >
              <Link href="/docs/quickstart" className="flex items-center">
                See How It Works
              </Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-[rgba(244,244,242,0.55)] text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#fb923c]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#fb923c]" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-[#fb923c]" />
              <span>Available worldwide</span>
            </div>
          </div>
        </motion.div>
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
