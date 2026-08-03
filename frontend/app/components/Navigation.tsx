"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronDown,
  Zap,
  Bot,
  Download,
  BookOpen,
  Github,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface DropdownItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const pathname = usePathname();
  const solutionsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const solutionsItems: DropdownItem[] = [
    {
      name: "Features",
      href: "/features",
      icon: <Zap className="h-5 w-5" />,
      description: "Explore all features of WorkContext",
    },
    {
      name: "AI Workspace",
      href: "/solutions/ai-workspace",
      icon: <Bot className="h-5 w-5" />,
      description: "Enhance your workspace with AI-powered suggestions",
    },
    {
      name: "Export Options",
      href: "/solutions/export-options",
      icon: <Download className="h-5 w-5" />,
      description: "Export your work in multiple formats",
    },
    {
      name: "Blogs",
      href: "/blogs",
      icon: <BookOpen className="h-5 w-5" />,
      description: "Read our latest articles and insights",
    },
  ];

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

  const handleMouseLeave = (
    setOpen: (open: boolean) => void,
    timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 300);
  };

  return (
    <nav className="fixed top-0 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/10 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <img
              src="/assets/images/WorkContext-Logo.png"
              alt="WorkContext Logo"
              className="h-20 w-auto group-hover:shadow-lg transition-all duration-300"
            />
            <span className="text-xl font-bold text-white">WorkContext</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() =>
                handleMouseEnter(setSolutionsOpen, solutionsTimeoutRef)
              }
              onMouseLeave={() =>
                handleMouseLeave(setSolutionsOpen, solutionsTimeoutRef)
              }
            >
              <div className="text-sm font-medium transition-colors duration-200 text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer focus:outline-none">
                Solutions
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    solutionsOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {solutionsOpen && (
                <div
                  className="fixed top-16 left-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 z-40"
                  onMouseEnter={() =>
                    handleMouseEnter(setSolutionsOpen, solutionsTimeoutRef)
                  }
                  onMouseLeave={() =>
                    handleMouseLeave(setSolutionsOpen, solutionsTimeoutRef)
                  }
                >
                  <div className="container-custom py-8">
                    <div className="flex gap-12">
                      {/* Links Grid */}
                      <div className="w-2/3 grid grid-cols-2 gap-6">
                        {solutionsItems.map((item, index) => (
                          <Link
                            key={index}
                            href={item.href}
                            className="group cursor-pointer flex flex-col p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                            onClick={() => setSolutionsOpen(false)}
                          >
                            <div className="flex items-center mb-2">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 text-blue-400 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                {item.icon}
                              </div>
                              <div className="font-semibold text-sm text-white group-hover:text-blue-300">
                                {item.name}
                              </div>
                            </div>
                            <div className="text-xs text-gray-400 pl-11 group-hover:text-gray-300">
                              {item.description}
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Promo Section */}
                      <div className="w-1/3 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-white/10 relative overflow-hidden group hover:border-white/20 transition-all">
                        <div className="relative z-10">
                          <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="h-6 w-6 text-blue-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">
                            Boost Your Team's Productivity
                          </h3>
                          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                            Discover how our context-aware workspace can help
                            your team connect ideas and get things done faster.
                          </p>
                          <Link
                            href="/signup"
                            className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Explore Analytics Hub
                            <ChevronDown className="ml-1 h-4 w-4 -rotate-90" />
                          </Link>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/roadmap"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
            >
              Roadmap
            </Link>

            <Link
              href="/changelog"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
            >
              Changelog
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-8">
            <Button
              asChild
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <div className="w-px h-6 bg-white/10" />
            <a
              href="https://github.com/marowa-labs/workcontext"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
            >
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-400 hover:text-white"
            >
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
          <div className="md:hidden py-4 border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl">
            <div className="flex flex-col space-y-4">
              <Link
                href="/features"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1",
                  pathname === "/features"
                    ? "text-blue-400"
                    : "text-gray-400 hover:text-white",
                )}
                onClick={() => setIsOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/roadmap"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1",
                  pathname === "/roadmap"
                    ? "text-blue-400"
                    : "text-gray-400 hover:text-white",
                )}
                onClick={() => setIsOpen(false)}
              >
                Roadmap
              </Link>
              <Link
                href="/changelog"
                className={cn(
                  "text-base font-medium transition-colors duration-200 px-2 py-1",
                  pathname === "/changelog"
                    ? "text-blue-400"
                    : "text-gray-400 hover:text-white",
                )}
                onClick={() => setIsOpen(false)}
              >
                Changelog
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start text-gray-400 hover:text-white"
                >
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <a
                  href="https://github.com/marowa-labs/workcontext"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Github className="h-5 w-5" />
                  <span>GitHub</span>
                </a>
                <Button
                  asChild
                  className="justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold"
                >
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    Sign Up
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
