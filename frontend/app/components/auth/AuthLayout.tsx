"use client";

import React from "react";
import Link from "next/link";
import { Shield, Sparkles, FileText, Search, Network } from "lucide-react";
import { cn } from "../../lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showSidebar?: boolean;
  white?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showSidebar = true,
  white = false,
}) => {
  return (
    <div className={cn("min-h-screen", white ? "bg-white" : "bg-[#121212]")}>
      <div className="flex min-h-screen">
        {/* Left Sidebar - Desktop Only */}
        {showSidebar && (
          <div className="hidden lg:flex lg:w-2/5 xl:w-1/2 relative overflow-hidden">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://www.keyvalue.systems/blog/content/images/2025/10/Context-engineering-for-smart-AI-agents.webp?w=800&h=600&fit=crop')",
              }}
            >
              <div className="absolute inset-0" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col justify-between p-12 text-white">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3">
                <img
                  src="/assets/images/WorkContext-Logo.png"
                  alt="WorkContextLogo"
                  className="h-22 w-auto"
                />
                <span className="text-xl font-bold text-white">
                  WorkContext
                </span>
              </Link>

              {/* Main Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold leading-tight text-white">
                    Your Academic Success, Defended.
                  </h1>
                  <p className="text-xl text-blue-200">
                    The AI Research Co-Pilot that turns academic overwhelm into
                    actionable insights.
                  </p>
                </div>

                {/* Benefits */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Search className="h-5 w-5 text-green-400" />
                    <span className="text-lg text-gray-300">
                      Intelligent Paper Discovery
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-5 w-5 text-green-400" />
                    <span className="text-lg text-gray-300">
                      AI-Powered Summarization & Gaps
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Network className="h-5 w-5 text-green-400" />
                    <span className="text-lg text-gray-300">
                      Visual Insight Mapping
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-400" />
                    <span className="text-lg text-gray-300">
                      Ethical AI Safeguards
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-blue-200">
                <p className="text-sm">
                  © {new Date().getFullYear()} WorkContext. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Right Content */}
        <div
          className={cn(
            "flex-1 flex items-center justify-center p-8",
            showSidebar ? "lg:w-3/5 xl:w-1/2" : "w-full",
          )}
        >
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center">
              <Link
                href="/"
                className={cn(
                  "inline-flex items-center space-x-3",
                  white ? "text-gray-900" : "text-gray-300",
                )}
              >
                <img
                  src="/assets/images/WorkContext-Logo.png"
                  alt="WorkContextLogo"
                  className="h-8 w-auto text-blue-600"
                />
                <span className="text-xl font-bold">WorkContext</span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center space-y-2">
              <h2
                className={cn(
                  "text-3xl font-bold",
                  white ? "text-gray-900" : "text-white",
                )}
              >
                {title}
              </h2>
              <p className={white ? "text-gray-600" : "text-gray-300"}>
                {subtitle}
              </p>
            </div>

            {/* Form Content */}
            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
