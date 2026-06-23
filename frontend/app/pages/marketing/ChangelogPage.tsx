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
    title: "Enhanced Collaboration & Dashboard",
    description:
      "Major update introducing real-time collaboration improvements, an enhanced dashboard with analytics, and smarter task management features for teams.",
    improvements: [
      "Added real-time collaboration with presence indicators",
      "Added dashboard with task analytics and progress charts",
      "Added subtask management with progress tracking",
      "Added time tracking for tasks",
    ],
    fixes: [
      "Fixed task drag-and-drop on mobile devices",
      "Resolved WebSocket reconnection issues",
    ],
  },
  {
    version: "1.3.0",
    date: "Jan 24, 2026",
    title: "Task Management Overhaul",
    description:
      "Completely refactored the task management system with a new Gantt chart timeline view, kanban board, and improved task detail panels.",
    improvements: [
      "Added Gantt chart timeline view with smooth scrolling",
      "Added Kanban board with drag-and-drop columns",
      "Added task dependencies and blocking relationships",
      "Added recurring task support with cron scheduling",
    ],
  },
  {
    version: "1.2.0",
    date: "Jan 22, 2026",
    title: "AI Assistant & Smart Features",
    description:
      "Introduced AI-powered writing assistance, smart task extraction from text, and multi-model AI support with BYOK (Bring Your Own Key).",
    improvements: [
      "Added AI chat assistant with context-aware responses",
      "Added task extraction from highlighted text",
      "Added support for multiple AI models (Gemini, OpenAI, OpenRouter)",
      "Added BYOK encryption for API keys at rest",
    ],
  },
  {
    version: "1.1.0",
    date: "Jan 18, 2026",
    title: "Workspaces & Team Management",
    description:
      "Added multi-workspace support with role-based access control, team invitations, and real-time notifications.",
    improvements: [
      "Added workspace creation and management",
      "Added role-based access (Admin, Editor, Viewer)",
      "Added team invitation via email",
      "Added real-time notification system via WebSocket",
    ],
  },
  {
    version: "1.0.0",
    date: "Jan 15, 2026",
    title: "Initial Release",
    description:
      "Launch of WorkContext — a context-aware productivity workspace for individuals and teams. Features include document editing, task management, and AI-powered writing assistance.",
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
                WorkContext
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
                href="/roadmap"
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-full transition-colors"
              >
                View Roadmap
              </Link>
              <Link
                href="https://github.com/marowa-labs/workcontext"
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-full transition-colors"
              >
                Contribute on GitHub
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
                className="flex flex-col md:flex-row gap-8 md:gap-0"
              >
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
                        className="border-b border-gray-200/50 last:border-0"
                      >
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
                                className="text-gray-600 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:bg-green-400 before:rounded-full"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Fixes */}
                      <AccordionItem
                        value="fixes"
                        className="border-b border-gray-200/50 last:border-0"
                      >
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
                                className="text-gray-600 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:bg-orange-400 before:rounded-full"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Patches */}
                      <AccordionItem
                        value="patches"
                        className="border-b border-gray-200/50 last:border-0"
                      >
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
                                className="text-gray-600 pl-4 relative before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:bg-blue-400 before:rounded-full"
                              >
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
