"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";

// Intro Hero Section
function IntroHero() {
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
            Academic Defensibility{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
            Find answers to common questions about our core academic
            defensibility tools. If you can't find what you're looking for, our
            support team is here to help.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 btn-glow px-8 py-6"
              onClick={() => {
                const element = document.getElementById("contact-support");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                }
              }}>
              Contact Support
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 bg-white border-white text-white hover:bg-white"
              asChild>
              <Link href="/help">Visit Help Center</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// FAQ Item Component
interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white rounded-2xl overflow-hidden mb-4">
      <button
        className="flex justify-between items-center w-full p-6 text-left bg-white hover:bg-white transition-colors"
        onClick={() => setIsOpen(!isOpen)}>
        <h3 className="text-lg font-semibold text-white">{question}</h3>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-200" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-200" />
        )}
      </button>
      {isOpen && (
        <div className="p-6 pt-0 bg-white">
          <p className="text-gray-200">{answer}</p>
        </div>
      )}
    </div>
  );
}

// FAQ Categories
function FAQCategories() {
  const categories = [
    {
      title: "The Explainable Originality Map",
      faqs: [
        {
          question: "How does the Explainable Originality Map work?",
          answer:
            "Our Explainable Originality Map provides a visual representation of your content's originality with detailed similarity reports. It goes beyond basic plagiarism detection to show you exactly where matches occur and why, helping you understand and address potential issues before submission.",
        },
        {
          question: "What sources does the Originality Map compare against?",
          answer:
            "Our system compares your content against billions of web pages, academic papers, publications, and journals. The Originality Map provides detailed source attribution and similarity percentages for each section of your document.",
        },
        {
          question: "How can I use the Originality Map to improve my work?",
          answer:
            "The Originality Map highlights areas of concern with visual indicators and provides suggestions for proper attribution. You can see exactly where you need to add citations or rephrase content to ensure academic integrity.",
        },
      ],
    },
    {
      title: "The Citation Confidence Auditor",
      faqs: [
        {
          question: "What is the Citation Confidence Auditor?",
          answer:
            "The Citation Confidence Auditor validates your citations and ensures they meet academic standards. It checks for proper formatting, verifies that cited sources exist, and confirms that your citations accurately represent the original content.",
        },
        {
          question:
            "Which citation styles does the Citation Confidence Auditor support?",
          answer:
            "The Citation Confidence Auditor supports over 7,000 citation styles including APA, MLA, Chicago, Harvard, Vancouver, and many more. It automatically formats your bibliography according to your selected style and updates it as you add new sources.",
        },
        {
          question:
            "How does the Citation Confidence Auditor verify citations?",
          answer:
            "Our system cross-references your citations against authoritative databases and publication records. It identifies potential issues with citation accuracy, formatting, and completeness to ensure your work meets academic standards.",
        },
      ],
    },
    {
      title: "Submission-Safe Writing Mode",
      faqs: [
        {
          question: "What is Submission-Safe Writing Mode?",
          answer:
            "Submission-Safe Writing Mode uses AI detection to help you write with confidence while ensuring your work remains academically defensible. It provides real-time feedback on AI usage and suggests ways to maintain your unique voice.",
        },
        {
          question: "How does the AI detection work in Submission-Safe Mode?",
          answer:
            "Our advanced AI detection algorithms analyze your text to identify sections that may have been generated by AI tools. It provides confidence scores and suggests ways to humanize content while preserving your ideas.",
        },
        {
          question: "Can I trust the AI detection results?",
          answer:
            "Yes, our AI detection has been trained on extensive datasets and provides highly accurate results. However, we always recommend using the results as guidance and making final decisions based on your understanding of your own work.",
        },
      ],
    },
    {
      title: "Defensibility & Publication",
      faqs: [
        {
          question: "What is the Defensibility Log?",
          answer:
            "The Defensibility Log tracks and maintains authorship certificates for your academic work. It creates a verifiable record of your contributions, revisions, and the evolution of your ideas throughout the writing process.",
        },
        {
          question: "How does the One-Click Publication Suite work?",
          answer:
            "The One-Click Publication Suite formats your work to academic standards with a single click. It applies the correct formatting, citation style, and structure required by specific journals or institutions.",
        },
        {
          question:
            "How does ScholarForge AIensure my work is publication-ready?",
          answer:
            "Our comprehensive suite of tools checks for originality, citation accuracy, formatting requirements, and academic standards. The system generates a defensibility report that confirms your work meets all requirements for academic submission.",
        },
      ],
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Core Functionality Questions
            </h2>
            <p className="text-lg text-gray-200">
              Browse our FAQ categories focused on academic defensibility tools
              to find the information you need.
            </p>
          </div>

          <div className="space-y-16">
            {categories.map((category, index) => (
              <div key={index}>
                <h3 className="text-2xl font-bold text-white mb-6">
                  {category.title}
                </h3>
                <div className="space-y-4">
                  {category.faqs.map((faq, idx) => (
                    <FAQItem key={idx} {...faq} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Contact Support
function ContactSupport() {
  const supportOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description:
        "Send us a detailed message and we'll respond within 24 hours.",
      action: "support@scholarforgeai.com",
    },
    {
      icon: MessageCircle,
      title: "Schedule a Meeting",
      description: "Book a 30-minute session with our support team.",
      action: "Schedule Now",
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call us for immediate assistance with urgent issues.",
      action: "Call Now",
      isPhone: true,
      phoneNumbers: ["+919063586568", "+918790813536"],
    },
  ];

  return (
    <section id="contact-support" className="section-padding bg-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Academic Defensibility Support
            </h2>
            <p className="text-lg text-gray-200">
              Our support team is here to assist you with any questions about
              our core defensibility tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {supportOptions.map((option, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg text-center border border-white">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-6">
                  <option.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {option.title}
                </h3>
                <p className="text-gray-200 mb-4">{option.description}</p>
                {option.title === "Schedule a Meeting" ? (
                  <a
                    href="https://calendly.com/audacityimpact/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white bg-white hover:bg-white text-white h-10 px-4 py-2">
                    {option.action}
                  </a>
                ) : option.isPhone ? (
                  <button
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white bg-white hover:bg-white text-white h-10 px-4 py-2 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      // Try primary number first
                      window.location.href = `tel:${option.phoneNumbers[0]}`;
                      // Set a timeout to try secondary number if primary fails
                      setTimeout(() => {
                        window.location.href = `tel:${option.phoneNumbers[1]}`;
                      }, 3000);
                    }}>
                    {option.action}
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full bg-white border-white text-white hover:bg-white">
                    {option.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Closing CTA
function ClosingCTA() {
  const router = useRouter();

  return (
    <section className="section-padding bg-gradient-to-br from-gray-800 to-gray-900">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Master Academic Defensibility?
          </h2>
          <p className="text-lg text-gray-200 mb-8">
            Join thousands of academics who are already mastering academic
            defensibility with our core tools.
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
  );
}

export default function FAQsPage() {
  return (
    <Layout>
      <IntroHero />
      <FAQCategories />
      <ContactSupport />
      <ClosingCTA />
    </Layout>
  );
}
