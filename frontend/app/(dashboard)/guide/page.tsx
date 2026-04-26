"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  FolderOpen,
  BarChart3,
  ChevronRight,
  ArrowLeft,
  Zap,
  Lightbulb,
  Keyboard,
  BookOpen,
  Play,
  Check,
  X,
} from "lucide-react";
import { SlashCommandPalette } from "../../components/dashboard/SlashCommandPalette";

interface CommandExample {
  command: string;
  description: string;
  example: string;
}

const commandCategories = [
  {
    id: "ai",
    title: "AI Commands",
    icon: <Sparkles className="w-5 h-5" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    commands: [
      { command: "/ai chat", description: "Open AI assistant", example: "Ask anything about your work" },
      { command: "/summarize", description: "Analyze and summarize workspace", example: "/summarize Q3 Marketing Plan" },
      { command: "/analyze", description: "Deep analysis of content", example: "/analyze current document" },
    ],
  },
  {
    id: "create",
    title: "Create Commands",
    icon: <Plus className="w-5 h-5" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
    commands: [
      { command: "/create task", description: "Add a new task", example: "/create task Review proposal by Friday" },
      { command: "/create space", description: "Create new workspace", example: "/create space Product Launch 2026" },
      { command: "/create note", description: "Quick note creation", example: "/create note Meeting ideas" },
    ],
  },
  {
    id: "navigate",
    title: "Navigation",
    icon: <FolderOpen className="w-5 h-5" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    commands: [
      { command: "/go workspace", description: "Jump to workspace", example: "/go workspace Marketing" },
      { command: "/go project", description: "Open specific project", example: "/go project Website Redesign" },
      { command: "/search", description: "Search everything", example: "/search budget spreadsheet" },
    ],
  },
  {
    id: "analyze",
    title: "Analytics & Insights",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    commands: [
      { command: "/stats", description: "View workspace stats", example: "/stats this week" },
      { command: "/progress", description: "Check project progress", example: "/progress Q4 Goals" },
      { command: "/insights", description: "AI-generated insights", example: "/insights team productivity" },
    ],
  },
];

const keyboardShortcuts = [
  { key: "/", description: "Open command palette" },
  { key: "⌘K", description: "Open search/command menu" },
  { key: "Esc", description: "Close any open panel" },
  { key: "⌘Enter", description: "Execute selected command" },
  { key: "↑↓", description: "Navigate commands" },
];

export default function GuidePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("ai");
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [demoFeedback, setDemoFeedback] = useState<{ type: 'success' | 'info', message: string } | null>(null);
  const [lastPressedKey, setLastPressedKey] = useState<string | null>(null);

  // Show feedback toast
  const showFeedback = useCallback((type: 'success' | 'info', message: string) => {
    setDemoFeedback({ type, message });
    setTimeout(() => setDemoFeedback(null), 3000);
  }, []);

  // Execute command action
  const executeCommand = useCallback((commandId: string) => {
    switch (commandId) {
      case "/ai chat":
      case "ai-chat":
        window.dispatchEvent(new CustomEvent("open-ai-chat"));
        showFeedback('success', 'AI Chat opened!');
        break;
      case "/summarize":
      case "summarize":
        window.dispatchEvent(new CustomEvent("summarize-workspace"));
        showFeedback('success', 'Workspace summary requested!');
        break;
      case "/create task":
      case "create-task":
        window.dispatchEvent(new CustomEvent("create-quick-task"));
        showFeedback('success', 'Quick task creation opened!');
        break;
      case "/create space":
      case "create-space":
        window.dispatchEvent(new CustomEvent("create-project"));
        showFeedback('success', 'Create space dialog opened!');
        break;
      case "/search":
      case "search":
        window.dispatchEvent(new CustomEvent("open-search"));
        showFeedback('success', 'Search opened!');
        break;
      case "/go workspace":
      case "go-workspace":
        router.push("/projects");
        break;
      case "/stats":
      case "stats":
        router.push("/projects");
        showFeedback('success', 'Navigating to workspace stats!');
        break;
      default:
        showFeedback('info', `Command "${commandId}" triggered!`);
    }
  }, [router, showFeedback]);

  // Listen for keyboard shortcuts demo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "/") {
        e.preventDefault();
        setLastPressedKey("/");
        setShowCommandPalette(true);
        setTimeout(() => setLastPressedKey(null), 500);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setLastPressedKey("⌘K");
        setShowCommandPalette(true);
        setTimeout(() => setLastPressedKey(null), 500);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Command Palette */}
      <SlashCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* Feedback Toast */}
      {demoFeedback && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all ${demoFeedback.type === 'success'
          ? 'bg-emerald-500 text-white'
          : 'bg-blue-500 text-white'
          }`}>
          {demoFeedback.type === 'success' ? <Check className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
          <span className="font-medium">{demoFeedback.message}</span>
          <button onClick={() => setDemoFeedback(null)} className="ml-2 opacity-80 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                How to Use ScholarForge
              </h1>
              <p className="text-muted-foreground">
                Master the command palette and boost your productivity
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-12">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Quick Start</h2>
              <p className="text-blue-100 mb-4">
                ScholarForge is your AI-powered productivity workspace. Everything starts with a command.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${lastPressedKey === "/"
                    ? "bg-white text-blue-600 scale-110"
                    : "bg-white/20 hover:bg-white/30"
                    }`}
                >
                  Press /
                </button>
                <span className="text-blue-100 self-center">or</span>
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-sm transition-all ${lastPressedKey === "⌘K"
                    ? "bg-white text-blue-600 scale-110"
                    : "bg-white/20 hover:bg-white/30"
                    }`}
                >
                  ⌘K
                </button>
                <span className="text-blue-100 self-center">to open commands</span>
                <span className="text-blue-200 text-sm self-center ml-2">(Try it now!)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Command Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Category Tabs */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Command Categories
            </h3>
            {commandCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeCategory === cat.id
                  ? "bg-card shadow-md border border-border"
                  : "hover:bg-muted"
                  }`}
              >
                <div className={`p-2 rounded-lg ${cat.bgColor}`}>
                  <span className={cat.color}>{cat.icon}</span>
                </div>
                <span className="font-medium text-foreground">{cat.title}</span>
                {activeCategory === cat.id && (
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Command List */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                {commandCategories.find((c) => c.id === activeCategory)?.title} Commands
              </h3>
              <div className="space-y-4">
                {commandCategories
                  .find((c) => c.id === activeCategory)
                  ?.commands.map((cmd, idx) => (
                    <div
                      key={idx}
                      className="group flex items-start gap-4 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <button
                        onClick={() => executeCommand(cmd.command)}
                        className="px-3 py-1.5 bg-slate-900 text-emerald-400 rounded-lg text-sm font-mono whitespace-nowrap hover:bg-slate-800 hover:text-emerald-300 transition-colors cursor-pointer"
                        title="Click to try this command"
                      >
                        {cmd.command}
                      </button>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {cmd.description}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Example: {cmd.example}
                        </p>
                      </div>
                      <button
                        onClick={() => executeCommand(cmd.command)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                        title="Try this command"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-muted rounded-lg">
                <Keyboard className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground">
                Keyboard Shortcuts
              </h3>
            </div>
            <div className="space-y-3">
              {keyboardShortcuts.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-2xl border border-amber-500/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-card rounded-lg shadow-sm">
                <Lightbulb className="w-5 h-5 text-amber-500" />
              </div>
              <h3 className="font-semibold text-foreground">
                Pro Tips
              </h3>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Use natural language with AI commands - no need to be exact</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Create tasks directly from highlighted text in the editor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Mention people with @ to notify them automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">•</span>
                <span>Use /summarize to get quick insights on any workspace</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Ready to start? Try your first command now.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/25"
          >
            Go to Dashboard
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
