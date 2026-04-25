"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Zap,
  PenTool,
  Brain,
  Lightbulb,
  FileText,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const AIWritingPage = () => {
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

  const features = [
    {
      icon: <Sparkles className="h-8 w-8 text-blue-600" />,
      title: "Content Generation",
      description: "Generate high-quality academic content with AI assistance",
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: "Real-time Suggestions",
      description: "Get instant writing suggestions as you type",
    },
    {
      icon: <PenTool className="h-8 w-8 text-purple-600" />,
      title: "Style Enhancement",
      description: "Improve clarity, coherence, and academic tone",
    },
    {
      icon: <Brain className="h-8 w-8 text-orange-600" />,
      title: "Research Integration",
      description: "Incorporate relevant research directly into your writing",
    },
  ];

  const writingModes = [
    {
      title: "Draft Mode",
      description: "Generate initial content and ideas",
      level: "Beginner",
      icon: <Lightbulb className="h-6 w-6 text-yellow-600" />,
    },
    {
      title: "Refinement Mode",
      description: "Enhance existing content for clarity and flow",
      level: "Intermediate",
      icon: <FileText className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Polish Mode",
      description: "Finalize content with grammar and style checks",
      level: "Advanced",
      icon: <Sparkles className="h-6 w-6 text-purple-600" />,
    },
  ];

  const bestPractices = [
    {
      title: "Be Specific",
      description: "Provide clear context and instructions for better results",
    },
    {
      title: "Review Output",
      description: "Always review and edit AI-generated content",
    },
    {
      title: "Maintain Voice",
      description: "Ensure the content reflects your unique academic voice",
    },
    {
      title: "Cite Sources",
      description: "Properly attribute any referenced information",
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
          <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
            AI Writing Assistant
          </h1>
          <p className="text-lg text-black dark:text-black">
            Harness the power of AI to enhance your academic writing process
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Transform Your Writing
              </h2>
              <p className="opacity-90">
                Our AI Writing Assistant helps you write better, faster, and
                more confidently
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <PenTool className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Key Features
            </h2>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {feature.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Writing Modes
            </h2>
            <div className="space-y-4">
              {writingModes.map((mode, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 mr-3">{mode.icon}</div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {mode.title}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {mode.level}
                      </span>
                    </div>
                  </div>
                  <p className="text-black dark:text-black">
                    {mode.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                AI Ethics
              </h3>
              <p className="text-blue-800 dark:text-blue-200">
                Our AI is designed to assist, not replace, your academic work.
                Always maintain academic integrity and ensure all content
                reflects your own understanding and voice.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Best Practices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestPractices.map((practice, index) => (
              <div
                key={index}
                className={`${planCardClasses} p-4 flex items-start`}>
                <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3
                    className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                    {practice.title}
                  </h3>
                  <p className="mt-1 text-black dark:text-black">
                    {practice.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Getting Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-3 dark:bg-blue-900/30 dark:text-blue-300">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                1. Activate AI
              </h3>
              <p className="text-sm text-black mt-1 dark:text-black">
                Enable AI assistance in your document
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-3 dark:bg-blue-900/30 dark:text-blue-300">
                <PenTool className="h-6 w-6" />
              </div>
              <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                2. Write Naturally
              </h3>
              <p className="text-sm text-black mt-1 dark:text-black">
                Type as you normally would
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-3 dark:bg-blue-900/30 dark:text-blue-300">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                3. Review Suggestions
              </h3>
              <p className="text-sm text-black mt-1 dark:text-black">
                Accept or modify AI recommendations
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/docs/quickstart"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              View Quick Start Guide
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIWritingPage;
