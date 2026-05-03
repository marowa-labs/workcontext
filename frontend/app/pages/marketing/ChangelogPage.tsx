"use client";

import React from "react";
import Link from "next/link";
import { Info, MoveRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import Layout from "../../components/Layout";

interface ReleaseEntry {
  version: string;
  date: string;
  title: string;
  description: string;
  improvements?: string[];
  fixes?: string[];
  patches?: string[];
}

const releases: ReleaseEntry[] = [
  {
    version: "1.4.0",
    date: "Jan 25, 2026",
    title: "Competitive Parity & Discovery Frames",
    description:
      "Major update introducing key competitive features and new discovery workflows. Added Search Alerts for monitoring new papers, a dedicated Literature Review panel for quick discovery, and a Concept Map visualization.",
    improvements: [
      "Added Search Alerts Panel with daily/weekly frequency options",
      "Added Literature Review Panel with trending topics and search",
      "Added Concept Map Panel for visualizing citation connections",
    ],
    fixes: [
      "Fixed Search Alerts panel layout on narrow screens",
      "Resolved sidebar navigation state updates",
    ],
  },
  {
    version: "1.3.0",
    date: "Jan 24, 2026",
    title: "Citation Management Overhaul",
    description:
      "Completely refactored the citation management workflow. Moved from a modal-based approach to a persistent sidebar panel for better writing flow.",
    improvements: [
      "Refactored Citations Modal to Citations Panel (Sidebar)",
      "Added 'Search Citation' form with instant previews",
      "Added 'Manual Citation' form with dynamic author fields",
    ],
  },
  {
    version: "1.2.0",
    date: "Jan 22, 2026",
    title: "Verification & Global Analysis",
    description:
      "Introduced powerful verification tools to cross-check claims against multiple AI models, ensuring academic defensibility.",
    improvements: [
      "Added Verification Panel with Multi-LLM consensus (Gemini vs OpenRouter)",
      "Added Gap Analysis Panel to identify missing research perspectives",
      "Added 'Translate Abstract' feature for multi-language support",
    ],
  },
  {
    version: "1.0.0",
    date: "Jan 15, 2026",
    title: "Initial Release",
    description:
      "Launch of ScholarForge AI Editor MVP. Features include Smart Source Guide, NotebookLM integration, and core writing assistant tools.",
    patches: ["Initial public beta release"],
  },
];

export default function ChangelogPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-white text-gray-900 font-sans">
        {/* Header Section */}
        <header className="py-12 border-b border-gray-100">
          <div className="container mx-auto max-w-5xl px-6 flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-medium tracking-tight text-gray-900 mb-2">
                ScholarForge AI
              </h1>
              <div className="flex items-center gap-2">
                <h1 className="text-5xl font-medium tracking-tight text-gray-900">
                  Changelog
                </h1>
                <div className="h-10 w-0.5 bg-gradient-to-b from-blue-400 to-purple-400 ml-1 animate-pulse"></div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href="/docs"
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-full transition-colors">
                View docs
              </Link>
              <Link
                href="https://twitter.com/scholarforge"
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-full transition-colors">
                Follow us on X
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto max-w-5xl px-6 py-12">
          {/* Info Banner */}
          <div className="mb-16 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-blue-700 text-sm">
            <Info className="h-4 w-4 shrink-0" />
            <p>
              New versions are rolled out gradually and may take a recent
              refresh to appeal.
            </p>
          </div>

          {/* Table Headers */}
          <div className="flex border-b border-gray-100 pb-4 mb-8 text-sm font-medium text-gray-500">
            <div className="w-48 shrink-0">Version</div>
            <div className="flex-1">Description</div>
          </div>

          {/* Release List */}
          <div className="space-y-16">
            {releases.map((release) => (
              <div
                key={release.version}
                className="flex flex-col md:flex-row gap-8 md:gap-0">
                {/* Left Column: Version & Date */}
                <div className="w-48 shrink-0">
                  <div className="text-gray-500 font-medium mb-1">
                    {release.version}
                  </div>
                  <div className="text-gray-400 text-sm">{release.date}</div>
                </div>

                {/* Right Column: Content */}
                <div className="flex-1">
                  {/* Container for content */}
                  <div className="bg-gray-50/50 rounded-3xl p-8 hover:bg-gray-50 transition-colors duration-300">
                    <h2 className="text-2xl font-medium text-gray-900 mb-2">
                      {release.title}
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      {release.description}
                    </p>

                    {/* Accordions */}
                    <Accordion type="multiple" className="w-full space-y-1">
                      {/* Improvements */}
                      <AccordionItem
                        value="improvements"
                        className="border-b border-gray-200/50 last:border-0">
                        <AccordionTrigger className="hover:no-underline py-3 text-sm text-gray-500 hover:text-gray-900 data-[state=open]:text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>
                              Improvements (
                              {release.improvements
                                ? release.improvements.length
                                : 0}
                              )
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 py-2">
                            {release.improvements?.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-gray-600 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:bg-green-400 before:rounded-full">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Fixes */}
                      <AccordionItem
                        value="fixes"
                        className="border-b border-gray-200/50 last:border-0">
                        <AccordionTrigger className="hover:no-underline py-3 text-sm text-gray-500 hover:text-gray-900 data-[state=open]:text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>
                              Fixes ({release.fixes ? release.fixes.length : 0})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 py-2">
                            {release.fixes?.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-gray-600 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:bg-orange-400 before:rounded-full">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Patches */}
                      <AccordionItem
                        value="patches"
                        className="border-b border-gray-200/50 last:border-0">
                        <AccordionTrigger className="hover:no-underline py-3 text-sm text-gray-500 hover:text-gray-900 data-[state=open]:text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>
                              Patches (
                              {release.patches ? release.patches.length : 0})
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-2 py-2">
                            {release.patches?.map((item, idx) => (
                              <li
                                key={idx}
                                className="text-gray-600 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:bg-blue-400 before:rounded-full">
                                {item}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </Layout>
  );
}
