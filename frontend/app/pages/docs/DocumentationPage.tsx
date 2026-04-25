"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Zap,
  Users,
  FileText,
  BarChart3,
  Search,
  Shield,
  Download,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const DocumentationPage = () => {
  const {
    planCardClasses,
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
  } = usePlanStyling();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const router = useRouter();

  const documentationCategories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description:
        "Learn the basics and get up and running quickly with ScholarForge AI.",
      articles: 12,
      path: "/docs/quickstart",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "AI Writing Assistant",
      description:
        "Master our powerful AI tools to enhance your writing process.",
      articles: 18,
      path: "/docs/ai-writing",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Search,
      title: "Plagiarism Detection",
      description:
        "Ensure academic integrity with our comprehensive plagiarism tools.",
      articles: 15,
      path: "/docs/plagiarism",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Users,
      title: "Collaboration",
      description:
        "Work together seamlessly with real-time editing and sharing.",
      articles: 10,
      path: "/docs/collaboration",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: FileText,
      title: "Citations & References",
      description: "Manage citations and create bibliographies in any format.",
      articles: 14,
      path: "/docs/citations",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track your progress and improve your writing with data.",
      articles: 8,
      path: "/docs/analytics",
      color: "from-teal-500 to-green-500",
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Understand how we protect your data and privacy.",
      articles: 6,
      path: "/docs/privacy",
      color: "from-gray-500 to-gray-700",
    },
    {
      icon: Download,
      title: "Export & Publishing",
      description:
        "Export your work in any format for submission or publication.",
      articles: 9,
      path: "/docs/export",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const comingSoonFeatures = [
    {
      title: "Advanced Analytics Dashboard",
      description:
        "Track your writing progress, productivity trends, and improvement over time",
      status: "coming-soon",
      path: "/docs/analytics",
    },
    {
      title: "AI Literature Review Assistant",
      description: "Get AI-powered literature reviews and research summaries",
      status: "coming-soon",
      path: "/docs/literature-review",
    },
    {
      title: "Templates Marketplace",
      description:
        "Browse thousands of templates for research papers, essays, and more",
      status: "coming-soon",
      path: "/docs/templates",
    },
    {
      title: "Study Groups",
      description:
        "Create study groups, share notes, and collaborate with classmates",
      status: "coming-soon",
      path: "/docs/study-groups",
    },
  ];

  // Additional documentation items for search
  const additionalDocumentationItems = [
    {
      title: "FAQ",
      path: "/docs/faq",
      category: "Help Resources",
      description: "",
    },
    {
      title: "Troubleshooting Guide",
      path: "/docs/troubleshooting",
      category: "Help Resources",
      description: "",
    },
    {
      title: "Contact Support",
      path: "/help",
      category: "Help Resources",
      description: "",
    },
    {
      title: "Community Forum",
      path: "https://discord.gg/2MMSdX3Uee",
      category: "Community",
      description: "",
    },
    {
      title: "Feature Requests",
      path: "/docs/feature-request",
      category: "Community",
      description: "",
    },
    {
      title: "Beta Program",
      path: "/docs/beta-program",
      category: "Community",
      description: "",
    },
    {
      title: "Roadmap",
      path: "/docs/roadmap",
      category: "Coming Soon Features",
      description: "",
    },
    {
      title: "Literature Review",
      path: "/docs/literature-review",
      category: "Coming Soon Features",
      description: "",
    },
    {
      title: "Study Groups",
      path: "/docs/study-groups",
      category: "Coming Soon Features",
      description: "",
    },
    {
      title: "Templates",
      path: "/docs/templates",
      category: "Coming Soon Features",
      description: "",
    },
  ];

  // Combine all searchable items
  const allSearchableItems = [
    ...documentationCategories.map((category) => ({
      title: category.title,
      description: category.description,
      path: category.path,
      category: "Documentation Categories",
    })),
    ...comingSoonFeatures.map((feature) => ({
      title: feature.title,
      description: feature.description,
      path: feature.path,
      category: "Coming Soon Features",
    })),
    ...additionalDocumentationItems,
  ];

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Filter documentation items based on search query
    const filteredResults = allSearchableItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.description &&
          item.description.toLowerCase().includes(query.toLowerCase())) ||
        item.category.toLowerCase().includes(query.toLowerCase()),
    );

    setSearchResults(filteredResults);
    setShowSearchResults(true);
  };

  // Handle search result click
  const handleResultClick = (path: string, isExternal: boolean = false) => {
    if (isExternal) {
      window.open(path, "_blank");
    } else {
      router.push(path);
    }
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSearchResults && target && !target.closest(".search-container")) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearchResults]);

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          {/* Hero Section */}
          <div className="text-center">
            <h1
              className={`text-4xl md:text-5xl font-bold mb-6 ${planDocHeadingClasses}`}>
              ScholarForge AIDocumentation
            </h1>
            <p className="text-xl text-black max-w-3xl mx-auto mb-8 dark:text-black">
              Everything you need to know about using ScholarForge
              AIeffectively. From getting started to advanced features, we've
              got you covered.
            </p>

            {/* Search bar */}
            <div className="relative max-w-2xl mx-auto search-container">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-black" />
              </div>
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-4 text-lg border border-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm bg-white dark:bg-white text-black text-black"
              />

              {/* Search results dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-white rounded-xl shadow-lg border border-white border-white z-50 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            handleResultClick(
                              result.path,
                              result.path.startsWith("http"),
                            )
                          }
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white transition-colors duration-150">
                          <div className="font-medium text-black text-black">
                            {result.title}
                          </div>
                          {(result.description || result.category) && (
                            <div className="text-sm text-black dark:text-black mt-1">
                              {result.description || result.category}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-6 text-center">
                      <div className="text-black dark:text-black">
                        No documentation found matching "{searchQuery}"
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Documentation Categories */}
        <div className="mb-16">
          <h2 className={`text-2xl font-bold mb-8 ${planDocHeadingClasses}`}>
            Browse Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {documentationCategories.map((category, index) => (
              <Link
                key={index}
                href={category.path}
                className={`${planCardClasses} group p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <h3
                  className={`text-lg font-semibold mb-2 group-hover:text-blue-600 transition-colors ${planDocHeadingClasses}`}>
                  {category.title}
                </h3>
                <p className="text-black text-sm mb-3 dark:text-black">
                  {category.description}
                </p>
                <div className="flex items-center text-sm text-blue-600 font-medium dark:text-blue-400">
                  {category.articles} articles
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
        </div>

        {/* Coming Soon Features */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-2xl font-bold ${planDocHeadingClasses}`}>
              Coming Soon Features
            </h2>
            <Link href="/docs/roadmap" className={planDocLinkClasses}>
              View Full Roadmap
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comingSoonFeatures.map((feature, index) => (
              <div key={index} className={`${planCardClasses} p-6`}>
                <div className="flex items-start justify-between mb-3">
                  <h3
                    className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                    {feature.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    Coming Soon
                  </span>
                </div>
                <p className="text-black mb-4 dark:text-black">
                  {feature.description}
                </p>
                <Link href={feature.path} className={planDocLinkClasses}>
                  Learn more
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
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className={`${planCardClasses} p-8`}>
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Quick Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className={`font-semibold mb-3 ${planDocHeadingClasses}`}>
                Popular Articles
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/ai-writing" className={planDocLinkClasses}>
                    Getting Started with AI Writing
                  </Link>
                </li>
                <li>
                  <Link href="/docs/plagiarism" className={planDocLinkClasses}>
                    Understanding Plagiarism Reports
                  </Link>
                </li>
                <li>
                  <Link href="/docs/citations" className={planDocLinkClasses}>
                    Creating Perfect Citations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={`font-semibold mb-3 ${planDocHeadingClasses}`}>
                Help Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs/faq" className={planDocLinkClasses}>
                    Frequently Asked Questions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/troubleshooting"
                    className={planDocLinkClasses}>
                    Troubleshooting Guide
                  </Link>
                </li>
                <li>
                  <Link href="/help" className={planDocLinkClasses}>
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className={`font-semibold mb-3 ${planDocHeadingClasses}`}>
                Community
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://discord.gg/2MMSdX3Uee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={planDocLinkClasses}>
                    Community Forum
                  </a>
                </li>
                <li>
                  <Link
                    href="/docs/feature-request"
                    className={planDocLinkClasses}>
                    Feature Requests
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/beta-program"
                    className={planDocLinkClasses}>
                    Beta Program
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
