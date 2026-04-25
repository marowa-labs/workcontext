"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Link as LinkIcon,
  Database,
  Zap,
  Globe,
  CheckCircle,
  Edit,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const CitationsPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const citationStyles = [
    {
      name: "APA",
      description: "American Psychological Association style",
      version: "7th Edition",
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
    },
    {
      name: "MLA",
      description: "Modern Language Association style",
      version: "9th Edition",
      icon: <FileText className="h-6 w-6 text-green-600" />,
    },
    {
      name: "Chicago",
      description: "Chicago Manual of Style",
      version: "17th Edition",
      icon: <Database className="h-6 w-6 text-purple-600" />,
    },
    {
      name: "Harvard",
      description: "Harvard referencing style",
      version: "Latest",
      icon: <Globe className="h-6 w-6 text-orange-600" />,
    },
  ];

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-blue-600" />,
      title: "Auto-Generation",
      description: "Automatically create citations from source information",
    },
    {
      icon: <LinkIcon className="h-8 w-8 text-green-600" />,
      title: "Smart Linking",
      description: "Extract citation details directly from URLs",
    },
    {
      icon: <Edit className="h-8 w-8 text-purple-600" />,
      title: "Easy Editing",
      description: "Customize citations with our intuitive editor",
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-orange-600" />,
      title: "Format Validation",
      description: "Ensure citations meet style requirements",
    },
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "Add Source",
      description: "Enter source details or paste a URL",
    },
    {
      step: 2,
      title: "Select Style",
      description: "Choose your required citation format",
    },
    {
      step: 3,
      title: "Generate Citation",
      description: "Create properly formatted citation",
    },
    {
      step: 4,
      title: "Insert & Manage",
      description: "Add to document and manage your bibliography",
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          <Link
            href="/docs"
            className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
              Smart Citations
            </h1>
            <p className="text-lg text-black dark:text-black">
              Create, manage, and format citations with our intelligent citation
              tools
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Perfect Citations Every Time
              </h2>
              <p className="opacity-90">
                Our smart citation tools ensure your references are accurate and
                properly formatted
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <LinkIcon className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Supported Citation Styles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citationStyles.map((style, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-5 hover:border-purple-300 hover:bg-purple-50 transition-colors dark:hover:bg-purple-900/20`}>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 mr-3">{style.icon}</div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {style.name}
                      </h3>
                      <p className="text-sm text-black dark:text-black">
                        {style.version}
                      </p>
                    </div>
                  </div>
                  <p className="text-black dark:text-black">
                    {style.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Key Features
            </h2>
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className={`${planCardClasses} p-4`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                        {feature.title}
                      </h3>
                      <p className="text-sm text-black mt-1 dark:text-black">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Citation Workflow
          </h2>
          <div className="relative">
            <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-white"></div>
            <div className="space-y-8">
              {workflowSteps.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 relative">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-purple-100 border-2 border-purple-200 text-purple-800 font-bold text-lg z-10 relative dark:bg-purple-900/30 border-white-700 dark:text-purple-300">
                      {step.step}
                    </div>
                  </div>
                  <div className="ml-6 pb-8">
                    <h3
                      className={`text-xl font-semibold ${planDocHeadingClasses}`}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-black dark:text-black">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Best Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                When to Cite
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Direct quotes from sources
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Paraphrased ideas or information
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Statistical or factual data
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Visual materials (charts, graphs, images)
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${planDocHeadingClasses}`}>
                Citation Tips
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Keep track of all sources as you research
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Use our citation manager to organize sources
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    Double-check formatting before submission
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                  <span className="text-black dark:text-black">
                    <Link
                      href="/docs/plagiarism"
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
                      Run a plagiarism check
                    </Link>{" "}
                    to ensure proper attribution
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationsPage;
