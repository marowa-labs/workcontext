"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  FileText,
  BarChart3,
  Users,
  Zap,
  Bot,
  BookOpen,
  Lightbulb,
  Calendar,
  Download,
  Sparkles,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

// Define types for dropdown items
interface DropdownItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  // const [pricingOpen, setPricingOpen] = useState(false);
  const pathname = usePathname();

  // Refs for timeout management
  const productTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resourcesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const solutionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // const pricingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Define dropdown items with icons and descriptions based on footer navigation
  const productItems: DropdownItem[] = [
    {
      name: "Features",
      href: "/features",
      icon: <Zap className="h-5 w-5" />,
      description: "Explore all features of ScholarForge AI",
    },
    {
      name: "Integrations",
      href: "/integrations",
      icon: <Bot className="h-5 w-5" />,
      description: "Connect with your favorite tools",
    },
    {
      name: "What's New",
      href: "/changelog",
      icon: <Calendar className="h-5 w-5" />,
      description: "See the latest updates and improvements",
    },
    {
      name: "Roadmap",
      href: "/roadmap",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "Discover what's coming next",
    },
  ];

  {
    /* const pricingItems: DropdownItem[] = [
    {
      name: "Individual Plans",
      href: "/pricing",
      icon: <User className="h-5 w-5" />,
      description: "Plans for individual researchers and students",
    },
    {
      name: "Team & Institutional",
      href: "/institutional",
      icon: <Users className="h-5 w-5" />,
      description: "Plans for universities and research institutions",
    },
  ]; */
  }

  const resourcesItems: DropdownItem[] = [
    {
      name: "Blogs",
      href: "/blogs",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Read our latest articles and insights",
    },
    {
      name: "Case Studies",
      href: "/resources/case-studies",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "See how others use ScholarForge AIsuccessfully",
    },
    {
      name: "Help Center",
      href: "/help",
      icon: <Lightbulb className="h-5 w-5" />,
      description: "Get help with using ScholarForge AI",
    },
    {
      name: "Documentation",
      href: "/docs",
      icon: <FileText className="h-5 w-5" />,
      description: "Comprehensive guides and API references",
    },
  ];

  const solutionsItems: DropdownItem[] = [
    {
      name: "Analytics",
      href: "/solutions/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      description: "Track your writing and research progress",
    },

    {
      name: "Citations",
      href: "/solutions/citations",
      icon: <FileText className="h-5 w-5" />,
      description: "Generate and manage citations automatically",
    },
    {
      name: "Collaboration",
      href: "/solutions/collaboration",
      icon: <Users className="h-5 w-5" />,
      description: "Work together seamlessly in real-time",
    },
    {
      name: "AI Writing Assistant",
      href: "/solutions/ai-writing-assistant",
      icon: <Bot className="h-5 w-5" />,
      description: "Enhance your writing with AI-powered suggestions",
    },
    {
      name: "Export Options",
      href: "/resources/export-options",
      icon: <Download className="h-5 w-5" />,
      description: "Export your work in multiple formats",
    },
  ];

  // Handle mouse enter with delay cancellation
  const handleMouseEnter = (
    setOpen: (open: boolean) => void,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  // Handle mouse leave with delay
  const handleMouseLeave = (
    setOpen: (open: boolean) => void,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 300); // 300ms delay before closing
  };

  return (
    <nav className="fixed top-0 w-full bg-[#FAF9F6] border-b border-gray-200 z-50 rounded-b-xl">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <img
              src="/images/ScholarForge-AI-Logo.png"
              alt="ScholarForge AI Logo"
              className="h-10 w-auto group-hover:shadow-lg transition-all duration-300"
            />
            <span className="text-xl font-bold text-gray-700">
              ScholarForge AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Solutions Dropdown - 3 columns */}
            <div
              className="relative"
              onMouseEnter={() =>
                handleMouseEnter(setSolutionsOpen, solutionsTimeoutRef)
              }
              onMouseLeave={() =>
                handleMouseLeave(setSolutionsOpen, solutionsTimeoutRef)
              }>
              <div className="text-sm font-medium transition-colors duration-200 text-gray-700 flex items-center gap-1 cursor-pointer focus:outline-none">
                Solutions
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    solutionsOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {solutionsOpen && (
                <div
                  className="fixed top-16 left-0 w-full bg-[#FAF9F6] border-t border-gray-300 shadow-2xl z-40 rounded-b-xl"
                  onMouseEnter={() =>
                    handleMouseEnter(setSolutionsOpen, solutionsTimeoutRef)
                  }
                  onMouseLeave={() =>
                    handleMouseLeave(setSolutionsOpen, solutionsTimeoutRef)
                  }>
                  <div className="container-custom py-8">
                    <div className="flex gap-12">
                      {/* Left: Links Grid */}
                      <div className="w-2/3 grid grid-cols-3 gap-6">
                        {solutionsItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="group cursor-pointer flex flex-col p-2 rounded-lg hover:bg-gray-200/50 transition-colors"
                            onClick={() => setSolutionsOpen(false)}>
                            <div className="flex items-center mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                {item.icon}
                              </div>
                              <div className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">
                                {item.name}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 pl-11 group-hover:text-gray-500">
                              {item.description}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Right: Promo Section */}
                      <div className="w-1/3 bg-gradient-to-br from-gray-900 to-[#0a0a0a] rounded-xl p-6 border border-gray-300 relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="h-6 w-6 text-blue-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">
                            Boost Your Research Impact
                          </h3>
                          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Discover how our advanced analytics can help you
                            increase citation rates and research visibility.
                          </p>
                          <Link
                            href="/signup"
                            className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                            Explore Analytics Hub
                            <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
                          </Link>
                        </div>
                        {/* Decorative blob */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Product Dropdown - 2 columns */}
            <div
              className="relative"
              onMouseEnter={() =>
                handleMouseEnter(setProductOpen, productTimeoutRef)
              }
              onMouseLeave={() =>
                handleMouseLeave(setProductOpen, productTimeoutRef)
              }>
              <div className="text-sm font-medium transition-colors duration-200 text-gray-700 flex items-center gap-1 cursor-pointer focus:outline-none">
                Product
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    productOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {productOpen && (
                <div
                  className="fixed top-16 left-0 w-full bg-[#FAF9F6] border-t border-gray-300 shadow-2xl z-40 rounded-b-xl"
                  onMouseEnter={() =>
                    handleMouseEnter(setProductOpen, productTimeoutRef)
                  }
                  onMouseLeave={() =>
                    handleMouseLeave(setProductOpen, productTimeoutRef)
                  }>
                  <div className="container-custom py-8">
                    <div className="flex gap-12">
                      {/* Left: Links Grid */}
                      <div className="w-2/3 grid grid-cols-2 gap-6">
                        {productItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="group cursor-pointer flex flex-col p-2 rounded-lg hover:bg-gray-200/50 transition-colors"
                            onClick={() => setProductOpen(false)}>
                            <div className="flex items-center mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-purple-400 bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                                {item.icon}
                              </div>
                              <div className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">
                                {item.name}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 pl-11 group-hover:text-gray-500">
                              {item.description}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Right: Promo Section */}
                      <div className="w-1/3 bg-gradient-to-br from-gray-900 to-[#0a0a0a] rounded-xl p-6 border border-gray-300 relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Sparkles className="h-6 w-6 text-purple-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">
                            What's New in V2.0
                          </h3>
                          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Check out our latest features including the new
                            Graph View and enhanced PDF chat.
                          </p>
                          <Link
                            href="/changelog"
                            className="inline-flex items-center text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                            View Changelog
                            <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
                          </Link>
                        </div>
                        {/* Decorative blob */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm font-medium transition-colors duration-200 text-gray-700 flex items-center gap-1 cursor-pointer focus:outline-none">
              <Link href="/pricing">Pricing</Link>
            </div>

            {/* Resources Dropdown - 3 columns */}
            <div
              className="relative"
              onMouseEnter={() =>
                handleMouseEnter(setResourcesOpen, resourcesTimeoutRef)
              }
              onMouseLeave={() =>
                handleMouseLeave(setResourcesOpen, resourcesTimeoutRef)
              }>
              <div className="text-sm font-medium transition-colors duration-200 text-gray-700 flex items-center gap-1 cursor-pointer focus:outline-none">
                Resources
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    resourcesOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {resourcesOpen && (
                <div
                  className="fixed top-16 left-0 w-full bg-[#FAF9F6] border-t border-gray-300 shadow-2xl z-40 rounded-b-xl"
                  onMouseEnter={() =>
                    handleMouseEnter(setResourcesOpen, resourcesTimeoutRef)
                  }
                  onMouseLeave={() =>
                    handleMouseLeave(setResourcesOpen, resourcesTimeoutRef)
                  }>
                  <div className="container-custom py-8">
                    <div className="flex gap-12">
                      {/* Left: Links Grid */}
                      <div className="w-2/3 grid grid-cols-2 gap-6">
                        {resourcesItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="group cursor-pointer flex flex-col p-2 rounded-lg hover:bg-gray-200/50 transition-colors"
                            onClick={() => setResourcesOpen(false)}>
                            <div className="flex items-center mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-green-400 bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                {item.icon}
                              </div>
                              <div className="font-semibold text-sm text-gray-700 group-hover:text-gray-900">
                                {item.name}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 pl-11 group-hover:text-gray-500">
                              {item.description}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Right: Promo Section */}
                      <div className="w-1/3 bg-gradient-to-br from-gray-900 to-[#0a0a0a] rounded-xl p-6 border border-gray-300 relative overflow-hidden group">
                        <div className="relative z-10">
                          <div className="bg-green-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <BookOpen className="h-6 w-6 text-green-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">
                            Student Success Guide
                          </h3>
                          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Master the art of academic writing with our
                            comprehensive guides and tutorials.
                          </p>
                          <Link
                            href="/blog"
                            className="inline-flex items-center text-sm font-semibold text-green-400 hover:text-green-300 transition-colors">
                            Read Guides
                            <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
                          </Link>
                        </div>
                        {/* Decorative blob */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-colors"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button
              asChild
              variant="ghost"
              className="text-gray-700 hover:text-gray-900">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="text-gray-700 hover:text-gray-900 border-gray-300 bg-white">
              <Link href="/schedule-demo">Schedule Demo</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white btn-glow">
              <Link href="/signup">Start ScholarForge AI Free</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-gray-900">
              {isOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-300 bg-[#FAF9F6] rounded-b-xl">
            <div className="flex flex-col space-y-4">
              <Link
                href="/features"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1 text-gray-700 hover:text-gray-900",
                  pathname === "/features"
                    ? "text-white nav-link-active"
                    : "text-gray-700",
                )}
                onClick={() => setIsOpen(false)}>
                Features
              </Link>
              <Link
                href="/about"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1 text-gray-700 hover:text-gray-900",
                  pathname === "/about"
                    ? "text-white nav-link-active"
                    : "text-gray-700",
                )}
                onClick={() => setIsOpen(false)}>
                About
              </Link>
              <Link
                href="/contact"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1 text-gray-700 hover:text-gray-900",
                  pathname === "/contact"
                    ? "text-white nav-link-active"
                    : "text-gray-700",
                )}
                onClick={() => setIsOpen(false)}>
                Contact
              </Link>
              <Link
                href="/pricing"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1 text-gray-700 hover:text-gray-900",
                  pathname === "/pricing"
                    ? "text-white nav-link-active"
                    : "text-gray-700",
                )}
                onClick={() => setIsOpen(false)}>
                Pricing
              </Link>
              <Link
                href="/institutional"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1 text-gray-700 hover:text-gray-900",
                  pathname === "/institutional"
                    ? "text-white nav-link-active"
                    : "text-gray-700",
                )}
                onClick={() => setIsOpen(false)}>
                Team & Institutional
              </Link>
              <Link
                href="/help"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1 text-gray-700 hover:text-gray-900",
                  pathname === "/help"
                    ? "text-white nav-link-active"
                    : "text-gray-700",
                )}
                onClick={() => setIsOpen(false)}>
                Help
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-gray-300">
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start text-gray-700 hover:text-gray-900">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="justify-start text-gray-700 hover:text-gray-900 border-gray-300 bg-white">
                  <Link href="/schedule-demo" onClick={() => setIsOpen(false)}>
                    Schedule Demo
                  </Link>
                </Button>
                <Button
                  asChild
                  className="justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-6 rounded-lg btn-glow">
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    Start ScholarForge AI Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
