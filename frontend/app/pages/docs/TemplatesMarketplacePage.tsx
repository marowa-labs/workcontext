"use client";

import Link from "next/link";
import {
  Layout,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  FileText,
  Search,
  Heart,
} from "lucide-react";
import { useState } from "react";
import WaitlistService from "../../lib/utils/waitlistService";

const TemplatesMarketplacePage = () => {
  // Mock plan styling classes
  const planDocContentClasses = {
    container: "prose prose-gray max-w-none dark:prose-invert",
    heading: "text-2xl font-bold text-black text-black mb-4",
    subheading: "text-xl font-semibold text-black dark:text-black mb-3",
    paragraph: "text-black dark:text-black mb-4",
    listItem: "text-black dark:text-black mb-2",
  };

  const planDocHeadingClasses =
    "text-3xl font-bold text-black text-black mb-6";
  const planDocLinkClasses =
    "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline";
  const planCardClasses =
    "bg-white dark:bg-white rounded-lg shadow-md p-6 border border-white border-white";

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSubmitStatus({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: "" });

    try {
      // Send email to backend waitlist service using the proper service
      await WaitlistService.addToWaitlist({
        email,
        featureInterest: ["templates-marketplace"],
      });

      setSubmitStatus({
        type: "success",
        message:
          "Thank you! You have been added to the waitlist. We will notify you when the Templates Marketplace launches.",
      });
      setEmail(""); // Clear the email input
    } catch (error) {
      console.error("Error joining waitlist:", error);
      setSubmitStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "There was an error joining the waitlist. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/docs"
              className={`text-sm font-medium ${planDocLinkClasses}`}>
              Documentation
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-black"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <Link
                href="/docs/roadmap"
                className={`text-sm font-medium ml-1 md:ml-2 ${planDocLinkClasses}`}>
                Roadmap
              </Link>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-black"
                fill="currentColor"
                viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-black text-sm font-medium ml-1 md:ml-2">
                Templates Marketplace
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Hero Section */}
      <div className="bg-white dark:bg-white border-b border-white border-white p-10 mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mb-4 dark:bg-indigo-900/30 dark:text-indigo-200">
              Coming Soon
            </div>
            <h1
              className={`text-3xl md:text-4xl font-bold mb-4 ${planDocHeadingClasses}`}>
              Templates Marketplace
            </h1>
            <p className="text-xl text-black mb-6 dark:text-black">
              Browse thousands of templates for research papers, essays, and
              more from the ScholarForge AIcommunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  window.location.href = "#waitlist";
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center">
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="px-6 py-3 border border-white text-black rounded-lg hover:bg-gray-50 font-medium border-white dark:text-black dark:hover:bg-white">
                View Demo
              </button>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-white border border-white rounded-xl p-4 shadow-lg dark:bg-white border-white">
              <Layout className="h-16 w-16 text-indigo-600 mx-auto mb-2" />
              <p className="text-center text-sm text-black dark:text-black">
                Marketplace Preview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          The Challenge
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${planCardClasses} rounded-xl p-6`}>
            <Search className="h-8 w-8 text-red-500 mb-4" />
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Starting from Scratch
            </h3>
            <p className="text-black dark:text-black">
              Spending hours setting up document structure and formatting
              instead of focusing on content.
            </p>
          </div>
          <div className={`${planCardClasses} rounded-xl p-6`}>
            <FileText className="h-8 w-8 text-red-500 mb-4" />
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Format Consistency
            </h3>
            <p className="text-black dark:text-black">
              Difficulty maintaining consistent formatting and structure across
              multiple documents.
            </p>
          </div>
          <div className={`${planCardClasses} rounded-xl p-6`}>
            <Layout className="h-8 w-8 text-red-500 mb-4" />
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Limited Options
            </h3>
            <p className="text-black dark:text-black">
              Few template options that may not match your specific requirements
              or academic field.
            </p>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Our Solution
        </h2>
        <div
          className={`${planCardClasses} rounded-xl p-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:bg-gradient-to-br dark:from-green-900/20 dark:to-emerald-900/20`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3
                className={`text-xl font-semibold mb-4 ${planDocHeadingClasses}`}>
                Community-Powered Templates
              </h3>
              <p className="text-black mb-6 dark:text-black">
                Access thousands of professionally designed templates created by
                researchers, students, and educators.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-black dark:text-black">
                    Research paper templates
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-black dark:text-black">
                    Essay and thesis templates
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-black dark:text-black">
                    Presentation templates
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-white border border-white rounded-lg p-4 dark:bg-white border-white">
              <div className="h-48 bg-gray-100 rounded flex items-center justify-center dark:bg-white">
                <span className="text-black dark:text-black">
                  Template Gallery Preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${planCardClasses} rounded-xl p-6`}>
            <div className="flex items-start">
              <Layout className="h-6 w-6 text-indigo-600 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Template Library
                </h3>
                <p className="text-black dark:text-black">
                  Browse thousands of templates organized by category, academic
                  field, and document type.
                </p>
              </div>
            </div>
          </div>
          <div className={`${planCardClasses} rounded-xl p-6`}>
            <div className="flex items-start">
              <Zap className="h-6 w-6 text-indigo-600 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Free and Premium
                </h3>
                <p className="text-black dark:text-black">
                  Access free community templates or premium professionally
                  designed templates.
                </p>
              </div>
            </div>
          </div>
          <div className={`${planCardClasses} rounded-xl p-6`}>
            <div className="flex items-start">
              <Users className="h-6 w-6 text-indigo-600 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Community Submissions
                </h3>
                <p className="text-black dark:text-black">
                  Contribute your own templates and earn rewards from the
                  ScholarForge AIcommunity.
                </p>
              </div>
            </div>
          </div>
          <div className={`${planCardClasses} rounded-xl p-6`}>
            <div className="flex items-start">
              <Heart className="h-6 w-6 text-indigo-600 mt-1 mr-4 flex-shrink-0" />
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Favorites & Collections
                </h3>
                <p className="text-black dark:text-black">
                  Save your favorite templates and organize them into custom
                  collections for easy access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          How It Works
        </h2>
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-4 dark:bg-indigo-900/30 dark:text-indigo-300">
              1
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Browse Templates
              </h3>
              <p className="text-black dark:text-black">
                Search and browse thousands of templates by category, academic
                field, or specific requirements.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-4 dark:bg-indigo-900/30 dark:text-indigo-300">
              2
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Preview & Select
              </h3>
              <p className="text-black dark:text-black">
                Preview templates to see how they look and read reviews from
                other users before selecting.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-4 dark:bg-indigo-900/30 dark:text-indigo-300">
              3
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Customize & Use
              </h3>
              <p className="text-black dark:text-black">
                Customize the template with your content while maintaining the
                professional structure and formatting.
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-4 dark:bg-indigo-900/30 dark:text-indigo-300">
              4
            </div>
            <div id="waitlist">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Save & Share
              </h3>
              <p className="text-black dark:text-black">
                Save your customized template for future use or share it with
                collaborators.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Section */}
      <div className="bg-white dark:bg-white border-b border-white border-white border border-purple-200 rounded-2xl p-8 mb-12">
        <div className="text-center max-w-2xl mx-auto">
          <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${planDocHeadingClasses}`}>
            Be Among the First to Access the Marketplace
          </h2>
          <p className="text-black mb-6 dark:text-black">
            Join our waitlist to get early access to Templates Marketplace when
            it launches in Q1 2025.
          </p>

          {/* Status Message */}
          {submitStatus.type && (
            <div
              className={`mb-6 p-4 rounded-lg ${submitStatus.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-200 border-white-800"
                : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-200 border-white-800"
                }`}>
              {submitStatus.message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 border border-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-white border-white text-black"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className={`px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              disabled={isSubmitting}>
              {isSubmitting ? "Joining..." : "Join Waitlist"}
            </button>
          </form>
          <p className="text-sm text-black dark:text-black">
            Join 3,245 others on the waitlist
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div className="border-b border-white pb-6 border-white">
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Are all templates free to use?
            </h3>
            <p className="text-black dark:text-black">
              We offer both free community templates and premium professionally
              designed templates. Free templates are available to all users,
              while premium templates require a subscription.
            </p>
          </div>
          <div className="border-b border-white pb-6 border-white">
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Can I submit my own templates?
            </h3>
            <p className="text-black dark:text-black">
              Yes! We encourage community contributions. You can submit your
              templates to the marketplace and earn rewards based on downloads
              and ratings.
            </p>
          </div>
          <div className="border-b border-white pb-6 border-white">
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              When exactly will this launch?
            </h3>
            <p className="text-black dark:text-black">
              We're aiming for January 2025. Join the waitlist to get updates on
              our progress and be notified as soon as it's available.
            </p>
          </div>
          <div>
            <h3
              className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
              Will templates work with my citation style?
            </h3>
            <p className="text-black dark:text-black">
              Yes, all templates support major citation styles including APA,
              MLA, Chicago, and many more. You can also customize citation
              styles within each template.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesMarketplacePage;
