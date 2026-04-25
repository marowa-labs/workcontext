"use client";

import React from "react";
import Link from "next/link";
import { Crown, Lock, BookOpen, Zap, ArrowLeft } from "lucide-react";

const TemplatesLibraryGuide: React.FC = () => {
  // Mock plan styling classes
  const planDocContentClasses = {
    container: "prose prose-gray max-w-none dark:prose-invert",
    heading: "text-2xl font-bold text-black text-black mb-4",
    subheading: "text-xl font-semibold text-black dark:text-black mb-3",
    paragraph: "text-black dark:text-black mb-4",
    listItem: "text-black dark:text-black mb-2",
  };

  const planDocHeadingClasses = "text-3xl font-bold text-black text-black mb-6";
  const planDocLinkClasses =
    "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline";
  const planCardClasses =
    "bg-white dark:bg-white rounded-lg shadow-md p-6 border border-white border-white";

  return (
    <div className={`min-h-screen ${planDocContentClasses.container}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white mb-8">
        <div className="container-custom py-6">
          <Link
            href="/docs"
            className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
          <div className="text-center">
            <h1
              className={`text-4xl text-center font-bold mb-4 ${planDocHeadingClasses}`}>
              Templates Library
            </h1>
            <p className="text-xl text-black dark:text-black">
              Speed up your project creation with professionally designed
              templates
            </p>
          </div>
        </div>
      </div>

      <div className={`${planCardClasses} rounded-xl p-6 mb-8`}>
        <p className="text-black dark:text-black mb-4">
          The Templates Library provides access to hundreds of professionally
          designed templates for academic writing, research papers, essays, and
          more. Save hours on formatting and structure by starting with a
          ready-made template.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <Link
            href="templates"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-center">
            Browse Templates
          </Link>
          <Link
            href="templates/builder"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white dark:hover:bg-white text-black dark:text-black rounded-lg font-medium transition-colors text-center">
            Create Custom Template
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`${planCardClasses} rounded-xl p-6`}>
          <div className="flex items-center mb-4">
            <BookOpen className="w-8 h-8 text-blue-500 mr-3" />
            <h3 className={`text-xl font-bold ${planDocHeadingClasses}`}>
              Free Plan
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <Lock className="w-5 h-5 text-black mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Basic Templates Only: "Academic Essay," "Short Report"
              </span>
            </div>
            <div className="flex items-start">
              <Lock className="w-5 h-5 text-black mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Static preview thumbnail
              </span>
            </div>
            <div className="flex items-start">
              <Lock className="w-5 h-5 text-black mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                "Pro" badge on premium templates
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white border-white">
            <Link
              href="billing/subscription"
              className={`hover:underline font-medium ${planDocLinkClasses}`}>
              Upgrade to unlock more templates →
            </Link>
          </div>
        </div>

        <div className={`${planCardClasses} rounded-xl p-6`}>
          <div className="flex items-center mb-4">
            <Zap className="w-8 h-8 text-yellow-500 mr-3" />
            <h3 className={`text-xl font-bold ${planDocHeadingClasses}`}>
              Student Pro
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <BookOpen className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Full Template Gallery: Essays, lab reports, project proposals
              </span>
            </div>
            <div className="flex items-start">
              <BookOpen className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Filter by category (Subject, Difficulty)
              </span>
            </div>
            <div className="flex items-start">
              <BookOpen className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Instant "Create Project from Template"
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white border-white">
            <Link
              href="billing/subscription"
              className={`hover:underline font-medium ${planDocLinkClasses}`}>
              Learn more about Student Pro →
            </Link>
          </div>
        </div>

        <div className={`${planCardClasses} rounded-xl p-6`}>
          <div className="flex items-center mb-4">
            <Crown className="w-8 h-8 text-yellow-500 mr-3" />
            <h3 className={`text-xl font-bold ${planDocHeadingClasses}`}>
              Researcher
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <BookOpen className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Custom Template Builder: Create & save templates
              </span>
            </div>
            <div className="flex items-start">
              <BookOpen className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                Upload institutional templates
              </span>
            </div>
            <div className="flex items-start">
              <BookOpen className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <span className="text-black dark:text-black">
                "Smart Templates" auto-fill author info & affiliations
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white border-white">
            <Link
              href="billing/subscription"
              className={`hover:underline font-medium ${planDocLinkClasses}`}>
              Learn more about Researcher plan →
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 border-white-800 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-2">
          Visual FOMO Strategy
        </h3>
        <p className="text-blue-700 dark:text-blue-300">
          Free users see premium templates with grayed previews, creating
          curiosity and driving upgrades. This psychological approach helps
          users understand the value they're missing and encourages plan
          upgrades.
        </p>
      </div>

      <div className={`${planCardClasses} rounded-xl p-6`}>
        <h3 className={`text-xl font-bold mb-4 ${planDocHeadingClasses}`}>
          Getting Started
        </h3>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold mr-3 flex-shrink-0">
              1
            </span>
            <div>
              <h4 className={`font-medium ${planDocHeadingClasses}`}>
                Browse Templates
              </h4>
              <p className="text-black dark:text-black">
                Visit the Templates Marketplace to explore available templates
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold mr-3 flex-shrink-0">
              2
            </span>
            <div>
              <h4 className={`font-medium ${planDocHeadingClasses}`}>
                Preview & Select
              </h4>
              <p className="text-black dark:text-black">
                Preview templates to find the perfect match for your project
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold mr-3 flex-shrink-0">
              3
            </span>
            <div>
              <h4 className={`font-medium ${planDocHeadingClasses}`}>
                Use Template
              </h4>
              <p className="text-black dark:text-black">
                Click "Use Template" to create a new project based on the
                template
              </p>
            </div>
          </li>
          <li className="flex items-start">
            <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold mr-3 flex-shrink-0">
              4
            </span>
            <div>
              <h4 className={`font-medium ${planDocHeadingClasses}`}>
                Customize
              </h4>
              <p className="text-black dark:text-black">
                Customize the template content to match your specific needs
              </p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default TemplatesLibraryGuide;
