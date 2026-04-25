"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Code,
  Database,
  Shield,
  Zap,
  FileText,
  BookOpen,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const ApiOverviewPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const apiFeatures = [
    {
      icon: <Code className="h-8 w-8 text-blue-600" />,
      title: "RESTful API",
      description:
        "Access all ScholarForge AIfeatures through our intuitive REST API",
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure Authentication",
      description: "Industry-standard OAuth 2.0 and JWT authentication",
    },
    {
      icon: <Database className="h-8 w-8 text-purple-600" />,
      title: "Comprehensive Endpoints",
      description: "Full access to projects, documents, citations, and more",
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-600" />,
      title: "High Performance",
      description: "Optimized for speed and reliability with global CDN",
    },
  ];

  const endpoints = [
    {
      title: "Projects",
      description: "Create, manage, and organize your research projects",
      path: "/docs/developer/api/projects",
    },
    {
      title: "Documents",
      description: "Access and manipulate document content and metadata",
      path: "/docs/developer/api/documents",
    },
    {
      title: "Citations",
      description: "Manage citations, references, and bibliographies",
      path: "/docs/developer/api/citations",
    },
    {
      title: "Authentication",
      description: "Handle user authentication and authorization",
      path: "/docs/developer/api/auth",
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
            API Overview
          </h1>
          <p className="text-lg text-black dark:text-black">
            Integrate ScholarForge AIfunctionality into your applications
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Developer Integration</h2>
              <p className="opacity-90">
                Build powerful applications with our comprehensive API
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <Code className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Database className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Zap className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              API Features
            </h2>
            <div className="space-y-6">
              {apiFeatures.map((feature, index) => (
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
              Core Endpoints
            </h2>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <Link
                  key={index}
                  href={endpoint.path}
                  className={`${planCardClasses} p-5 block hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                    {endpoint.title}
                  </h3>
                  <p className="text-black dark:text-black mb-3">
                    {endpoint.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium dark:text-blue-400">
                    <span>Learn more</span>
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Getting Started
              </h3>
              <p className="text-blue-800 mb-4 dark:text-blue-200">
                Check out our API documentation to get started with integration.
              </p>
              <Link
                href="/docs/md/api-documentation"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                View Full Documentation
                <BookOpen className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            API Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-white rounded-lg p-5 border-white">
              <FileText className="h-8 w-8 text-blue-600 mb-3 dark:text-blue-400" />
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                API Reference
              </h3>
              <p className="text-black mb-4 dark:text-black">
                Detailed documentation for all API endpoints and parameters
              </p>
              <Link
                href="/docs/md/api-documentation"
                className={`font-medium text-sm ${planDocLinkClasses}`}>
                View Reference
              </Link>
            </div>

            <div className="border border-white rounded-lg p-5 border-white">
              <Code className="h-8 w-8 text-green-600 mb-3 dark:text-green-400" />
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Code Examples
              </h3>
              <p className="text-black mb-4 dark:text-black">
                Sample implementations in popular programming languages
              </p>
              <a
                href="#"
                className={`font-medium text-sm ${planDocLinkClasses}`}>
                Browse Examples
              </a>
            </div>

            <div className="border border-white rounded-lg p-5 border-white">
              <Shield className="h-8 w-8 text-purple-600 mb-3 dark:text-purple-400" />
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Security Guide
              </h3>
              <p className="text-black mb-4 dark:text-black">
                Best practices for securing your API integrations
              </p>
              <a
                href="#"
                className={`font-medium text-sm ${planDocLinkClasses}`}>
                Read Guide
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiOverviewPage;
