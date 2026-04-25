"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Database,
  Link as LinkIcon,
  Settings,
  Zap,
  Globe,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const CitationSystemPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const citationFeatures = [
    {
      icon: <Database className="h-8 w-8 text-blue-600" />,
      title: "Multi-Format Support",
      description: "APA, MLA, Chicago, IEEE, and 20+ other citation styles",
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: "Auto-Generation",
      description: "Automatically generate citations from source data",
    },
    {
      icon: <LinkIcon className="h-8 w-8 text-purple-600" />,
      title: "DOI Integration",
      description: "Fetch citation data directly from DOI identifiers",
    },
    {
      icon: <Globe className="h-8 w-8 text-orange-600" />,
      title: "CrossRef Integration",
      description: "Access millions of scholarly publications instantly",
    },
  ];

  const systemComponents = [
    {
      title: "Citation Manager",
      description:
        "Centralized storage and organization of all your references",
    },
    {
      title: "Bibliography Generator",
      description: "Create formatted reference lists in one click",
    },
    {
      title: "In-Text Citation Tool",
      description: "Insert properly formatted citations while writing",
    },
    {
      title: "Source Importer",
      description: "Import references from databases, PDFs, and websites",
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
            Citation System
          </h1>
          <p className="text-lg text-black dark:text-black">
            Comprehensive reference management and citation generation
          </p>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Intelligent Citation Management
              </h2>
              <p className="opacity-90">
                Streamline your research workflow with our powerful citation
                system
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Database className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <Settings className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Citation Features
            </h2>
            <div className="space-y-6">
              {citationFeatures.map((feature, index) => (
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
              System Components
            </h2>
            <div className="space-y-4">
              {systemComponents.map((component, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <h3
                    className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                    {component.title}
                  </h3>
                  <p className="text-black dark:text-black">
                    {component.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <h3
                className={`text-lg font-semibold mb-2 ${planDocHeadingClasses}`}>
                Integration APIs
              </h3>
              <p className="text-blue-800 mb-4 dark:text-blue-200">
                Connect with external databases and citation managers.
              </p>
              <Link
                href="/docs/developer/api/citations"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
                View Citation API
                <Database className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            How It Works
          </h2>
          <div className="prose max-w-none dark:prose-invert">
            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              1. Add Sources
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Import references from various sources:
            </p>
            <ul className="list-disc pl-5 mb-6 text-black dark:text-black">
              <li>Manual entry for books, journal articles, websites</li>
              <li>DOI lookup for automatic metadata retrieval</li>
              <li>PDF import with automatic metadata extraction</li>
              <li>Database integration with CrossRef, PubMed, and more</li>
            </ul>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              2. Organize References
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Keep your references organized with powerful tools:
            </p>
            <ul className="list-disc pl-5 mb-6 text-black dark:text-black">
              <li>Create custom folders and tags</li>
              <li>Smart filters and search capabilities</li>
              <li>Duplicate detection and merging</li>
              <li>Collaborative sharing with team members</li>
            </ul>

            <h3 className={`text-lg font-semibold ${planDocHeadingClasses}`}>
              3. Generate Citations
            </h3>
            <p className="text-black mb-4 dark:text-black">
              Create properly formatted citations and bibliographies:
            </p>
            <ul className="list-disc pl-5 mb-6 text-black dark:text-black">
              <li>In-text citations with automatic numbering</li>
              <li>Bibliography generation in multiple formats</li>
              <li>Real-time formatting as you write</li>
              <li>Consistency checking across your document</li>
            </ul>

            <div className="bg-gray-50 border border-white rounded-lg p-5 dark:bg-white border-white">
              <h4
                className={`text-md font-semibold mb-2 ${planDocHeadingClasses}`}>
                Example Citation Output
              </h4>
              <p className="text-black mb-2 dark:text-black">
                APA Format:
              </p>
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-black dark:text-black">
                Smith, J. (2023). The impact of climate change on biodiversity.
                Environmental Science Journal, 15(3), 127-145.
                https://doi.org/10.1234/esj.2023.15.3.127
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitationSystemPage;
