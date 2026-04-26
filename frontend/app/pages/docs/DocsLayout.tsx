"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, ChevronRight } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const DocsLayout = ({ children }: { children: React.ReactNode }) => {
  const { settings } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Only apply custom layout preferences if the user has enabled them for this layout
  const shouldApplyCustomLayout = settings.layoutDocs !== false;

  // Determine transition classes based on animation settings
  const getTransitionClasses = () => {
    // Only apply custom animation settings if user has enabled it for this layout
    if (!shouldApplyCustomLayout) {
      return "transition-colors duration-200"; // Default transitions
    }

    if (settings.reduceMotion) {
      return "transition-none";
    } else if (settings.animations === false) {
      return "transition-none";
    }
    return "transition-colors duration-200"; // default
  };

  const transitionClasses = getTransitionClasses();

  // Determine sidebar position classes based on user preference
  const getSidebarPositionClasses = () => {
    // Only apply custom sidebar position if user has enabled it for this layout
    const sidebarPosition = shouldApplyCustomLayout
      ? settings.sidebarPosition
      : "left"; // Default to left if not enabled

    if (sidebarPosition === "right") {
      return {
        sidebar:
          "fixed inset-y-0 right-0 z-40 w-64 bg-white dark:bg-white border-l border-white border-white",
        sidebarTransform: mobileMenuOpen ? "translate-x-0" : "translate-x-full",
        mainContent: "flex-1 md:mr-64 bg-gray-50 dark:bg-white",
        mobileOverlay: "fixed inset-0 z-30 bg-white bg-opacity-50 md:hidden",
      };
    } else {
      // Default to left position
      return {
        sidebar:
          "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-white border-r border-white border-white",
        sidebarTransform: mobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full",
        mainContent: "flex-1 md:ml-64 bg-gray-50 dark:bg-white",
        mobileOverlay: "fixed inset-0 z-30 bg-white bg-opacity-50 md:hidden",
      };
    }
  };

  const positionClasses = getSidebarPositionClasses();

  const documentationSections = [
    {
      title: "Getting Started",
      items: [
        { id: "introduction", label: "Introduction", path: "/docs" },
        {
          id: "quickstart",
          label: "Quick Start Guide",
          path: "/docs/quickstart",
        },
        {
          id: "installation",
          label: "Installation",
          path: "/docs/installation",
        },
        {
          id: "account-setup",
          label: "Account Setup",
          path: "/docs/account-setup",
        },
      ],
    },
    {
      title: "Core Features",
      items: [
        {
          id: "ai-writing",
          label: "AI Writing",
          path: "/docs/ai-writing",
        },
        {
          id: "plagiarism",
          label: "Plagiarism Detection",
          path: "/docs/plagiarism",
        },
        {
          id: "citations",
          label: "Citations & References",
          path: "/docs/citations",
        },
        {
          id: "collaboration",
          label: "Collaboration",
          path: "/docs/collaboration",
        },
        {
          id: "export",
          label: "Export Options",
          path: "/docs/export",
        },
        {
          id: "keyboard-shortcuts",
          label: "Keyboard Shortcuts",
          path: "/docs/keyboard-shortcuts",
        },
      ],
    },
    {
      title: "Advanced Features",
      items: [
        {
          id: "analytics",
          label: "Advanced Analytics",
          path: "/docs/analytics",
        },
        {
          id: "ai-writing",
          label: "AI Writing Assistant",
          path: "/docs/ai-writing-assistant",
        },
        {
          id: "templates",
          label: "Templates Marketplace",
          path: "/docs/templates",
        },
        {
          id: "templates-library",
          label: "Templates Library",
          path: "/docs/templates-library",
        },
      ],
    },
    {
      title: "Settings & Configuration",
      items: [
        { id: "profile", label: "Profile Settings", path: "/docs/profile" },
        { id: "account", label: "Account Management", path: "/docs/account" },
        {
          id: "notifications",
          label: "Notifications",
          path: "/docs/notifications",
        },
        { id: "billing", label: "Billing & Plans", path: "/docs/billing" },
        { id: "privacy", label: "Privacy & Security", path: "/docs/privacy" },
      ],
    },
    {
      title: "Developer Documentation",
      items: [
        { id: "api", label: "API Overview", path: "/docs/developer/api" },
        {
          id: "api-auth",
          label: "Authentication",
          path: "/docs/developer/api/auth",
        },
        {
          id: "api-projects",
          label: "Projects",
          path: "/docs/developer/api/projects",
        },
        {
          id: "api-documents",
          label: "Documents",
          path: "/docs/developer/api/documents",
        },
        {
          id: "api-citations",
          label: "Citations",
          path: "/docs/developer/api/citations",
        },
      ],
    },
    {
      title: "Development Docs",
      items: [
        {
          id: "how-to-use-plan-styling",
          label: "Plan Styling Guide",
          path: "/docs/md/how-to-use-plan-styling",
        },
        {
          id: "ui-ux-style-contrast",
          label: "UI/UX Style Contrast",
          path: "/docs/md/ui-ux-style-contrast",
        },
        {
          id: "ui-ux-upgrade-styling",
          label: "Upgrade Styling",
          path: "/docs/md/ui-ux-upgrade-styling",
        },
        {
          id: "api-documentation",
          label: "API Documentation",
          path: "/docs/md/api-documentation",
        },
        {
          id: "citation-system",
          label: "Citation System",
          path: "/docs/md/citation-system",
        },
      ],
    },
    {
      title: "Legal",
      items: [
        { id: "terms", label: "Terms of Service", path: "/docs/terms" },
        {
          id: "privacy-policy",
          label: "Privacy Policy",
          path: "/docs/privacy-policy",
        },
        { id: "security", label: "Security", path: "/docs/security" },
        { id: "cookies", label: "Cookie Policy", path: "/docs/cookies" },
        { id: "gdpr", label: "GDPR Compliance", path: "/docs/gdpr" },
      ],
    },
    {
      title: "Troubleshooting",
      items: [
        { id: "faq", label: "FAQ", path: "/docs/faq" },
        {
          id: "troubleshooting",
          label: "Troubleshooting",
          path: "/docs/troubleshooting",
        },
        {
          id: "contact-support",
          label: "Contact Support",
          path: "/docs/contact-support",
        },
      ],
    },
    {
      title: "Testing",
      items: [
        {
          id: "styling-test",
          label: "Documentation Styling Test",
          path: "/docs/styling-test",
        },
      ],
    },
    {
      title: "Community",
      items: [
        {
          id: "feature-request",
          label: "Feature Requests",
          path: "/docs/feature-request",
        },
        {
          id: "beta-program",
          label: "Beta Program",
          path: "/docs/beta-program",
        },
      ],
    },
  ];

  // Flatten all documentation items for easier searching
  const allDocumentationItems = documentationSections.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      section: section.title,
    })),
  );

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
    const filteredResults = allDocumentationItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase()),
    );

    setSearchResults(filteredResults);
    setShowSearchResults(true);
  };

  // Handle search result click
  const handleResultClick = (path: string) => {
    router.push(path);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
    setMobileMenuOpen(false);
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

  const getCurrentSection = () => {
    const path = location.pathname;
    for (const section of documentationSections) {
      const item = section.items.find((item) => item.path === path);
      if (item) return section.title;
    }
    return "ScholarForge AIDocs";
  };

  const currentSection = getCurrentSection();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/docs" className="flex items-center space-x-2">
                <img
                  src="/assets/images/ScholarForge-AI-Logo.png"
                  alt="ScholarForge AILogo"
                  className="h-10 w-auto"
                  style={{ color: `hsl(var(--accent))` }}
                />
                <span className="text-xl font-bold text-black text-black">
                  ScholarForge AIDocs : {currentSection}
                </span>
              </Link>
            </div>

            {/* Search bar */}
            <div className="flex items-center relative search-container flex-grow max-w-2xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black dark:text-black" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchResults(true)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-white border-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-white text-black text-black form-input"
                />
              </div>

              {/* Search results dropdown */}
              {showSearchResults && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-white rounded-lg shadow-lg border border-white border-white z-50 max-h-96 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.section}-${result.id}`}
                          onClick={() => handleResultClick(result.path)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white transition-colors duration-150">
                          <div className="font-medium text-black text-black">
                            {result.label}
                          </div>
                          <div className="text-xs text-black dark:text-black mt-1">
                            {result.section}
                          </div>
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

            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/help"
                className="text-black hover:text-blue-600 dark:text-black dark:hover:text-blue-400 accent-link">
                Help Center
              </Link>
              <Link
                href="/docs/features"
                className="text-black hover:text-blue-600 dark:text-black dark:hover:text-blue-400 accent-link">
                Features
              </Link>
              <Link
                href="/docs/billing"
                className="text-black hover:text-blue-600 dark:text-black dark:hover:text-blue-400 accent-link">
                Pricing
              </Link>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-md text-black hover:text-black hover:bg-gray-100 dark:text-black dark:hover:text-white dark:hover:bg-white ${transitionClasses}`}>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
          ${positionClasses.sidebar} transform transition-transform duration-300 ease-in-out md:translate-x-0
          ${positionClasses.sidebarTransform}
        `}>
          <div className="flex flex-col h-full pt-16">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Sidebar content */}
              <nav className="space-y-8">
                {documentationSections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-xs font-semibold text-black dark:text-black uppercase tracking-wider mb-3">
                      {section.title}
                    </h3>
                    <ul className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <li key={item.id}>
                            <Link
                              href={item.path}
                              className={`flex items-center justify-between px-3 py-2 text-sm rounded-md ${isActive
                                ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400 tab-active"
                                : "text-black hover:bg-gray-50 dark:text-black dark:hover:bg-white"
                                } ${transitionClasses}`}
                              onClick={() => setMobileMenuOpen(false)}>
                              <span>{item.label}</span>
                              {isActive && (
                                <ChevronRight
                                  className="h-4 w-4 text-blue-600 dark:text-blue-400"
                                  style={{ color: `hsl(var(--accent))` }}
                                />
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t border-white border-white">
              <Link
                href="/help"
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 accent-button">
                Visit Help Center
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className={positionClasses.mobileOverlay}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <main className={positionClasses.mainContent}>
          <div className="container-custom py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DocsLayout;
