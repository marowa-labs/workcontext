"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Code,
  Database,
  Shield,
  Zap,
  FileText,
  Download,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const ApiDocumentationPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const documentationSections = [
    {
      icon: <Code className="h-8 w-8 text-blue-600" />,
      title: "Getting Started",
      description: "Introduction to the ScholarForge AIAPI and authentication",
    },
    {
      icon: <Database className="h-8 w-8 text-green-600" />,
      title: "Core Resources",
      description:
        "Detailed documentation for projects, documents, and citations",
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-600" />,
      title: "Authentication",
      description: "Secure access to API endpoints with OAuth 2.0 and JWT",
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-600" />,
      title: "Rate Limits",
      description: "Understand API usage quotas and limitations",
    },
  ];

  const resources = [
    {
      title: "Projects API",
      description: "Manage research projects and their metadata",
      path: "/docs/developer/api/projects",
    },
    {
      title: "Documents API",
      description: "Create, edit, and manage document content",
      path: "/docs/developer/api/documents",
    },
    {
      title: "Citations API",
      description: "Organize citations and generate bibliographies",
      path: "/docs/developer/api/citations",
    },
    {
      title: "Authentication API",
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
            API Documentation
          </h1>
          <p className="text-lg text-black dark:text-black">
            Comprehensive reference for integrating with ScholarForge AI
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Developer Documentation
              </h2>
              <p className="opacity-90">
                Build powerful integrations with our comprehensive API reference
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Code className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Database className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Documentation Sections
            </h2>
            <div className="space-y-6">
              {documentationSections.map((section, index) => (
                <div
                  key={index}
                  className={`${planCardClasses} p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4 mt-1">
                      {section.icon}
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                        {section.title}
                      </h3>
                      <p className="mt-1 text-black dark:text-black">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Core API Resources
            </h2>
            <div className="space-y-4">
              {resources.map((resource, index) => (
                <Link
                  key={index}
                  href={resource.path}
                  className={`${planCardClasses} p-5 block hover:border-blue-300 hover:bg-blue-50 transition-colors dark:hover:bg-blue-900/20`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                    {resource.title}
                  </h3>
                  <p className="text-black dark:text-black mb-3">
                    {resource.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium dark:text-blue-400">
                    <span>View Documentation</span>
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
                Download API Specifications
              </h3>
              <p className="text-blue-800 mb-4 dark:text-blue-200">
                Get the OpenAPI specification for the ScholarForge AIAPI.
              </p>
              <div className="flex space-x-3">
                <a
                  href="#"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                  <Download className="mr-2 h-4 w-4" />
                  OpenAPI YAML
                </a>
                <a
                  href="#"
                  className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium text-sm dark:hover:bg-blue-900/20">
                  <FileText className="mr-2 h-4 w-4" />
                  API Reference
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            API Client Libraries
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <p className="text-black mb-6 dark:text-black">
              Accelerate your development with our official client libraries:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border border-white rounded-lg p-4 border-white">
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  JavaScript
                </h3>
                <pre className="bg-gray-100 dark:bg-white p-3 rounded text-sm mb-3">
                  <code>npm install @ScholarForge AI/api</code>
                </pre>
                <a href="#" className={`text-sm ${planDocLinkClasses}`}>
                  View Documentation
                </a>
              </div>

              <div className="border border-white rounded-lg p-4 border-white">
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Python
                </h3>
                <pre className="bg-gray-100 dark:bg-white p-3 rounded text-sm mb-3">
                  <code>pip install ScholarForge AI-api</code>
                </pre>
                <a href="#" className={`text-sm ${planDocLinkClasses}`}>
                  View Documentation
                </a>
              </div>

              <div className="border border-white rounded-lg p-4 border-white">
                <h3
                  className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Java
                </h3>
                <pre className="bg-gray-100 dark:bg-white p-3 rounded text-sm mb-3">
                  <code>gradle install ScholarForge AI-java</code>
                </pre>
                <a href="#" className={`text-sm ${planDocLinkClasses}`}>
                  View Documentation
                </a>
              </div>
            </div>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              Quick Start Example
            </h3>
            <pre className="bg-gray-100 dark:bg-white p-4 rounded-lg text-sm mb-4 overflow-x-auto">
              <code>{`import { ScholarForge AIClient } from '@ScholarForge AI/api';

const client = new ScholarForge AIClient({
  apiKey: 'your_api_key_here',
  baseUrl: 'https://api.scholarforgeai.com/v1'
});

// Create a new project
const project = await client.projects.create({
  name: 'My Research Project',
  description: 'A sample research project'
});

console.log('Created project:', project);`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocumentationPage;
