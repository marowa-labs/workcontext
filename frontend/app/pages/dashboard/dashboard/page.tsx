"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../../../lib/utils/useUser";
import { useTheme } from "../../../contexts/ThemeContext";
import { SlashCommandPalette } from "../../../components/dashboard/SlashCommandPalette";
import {
  Command,
  Sparkles,
  Plus,
  Search,
  MessageSquare,
  FolderOpen,
  FileText,
  ArrowRight,
  Zap,
  BarChart3,
  ChevronRight,
} from "lucide-react";

// Quick action tile component
interface ActionTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

function ActionTile({ icon, title, description, onClick, color }: ActionTileProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-start p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-all duration-200 text-left ${color}`}
    >
      <div className="mb-4 p-3 rounded-xl bg-muted group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        Get started <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { settings } = useTheme();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [greeting, setGreeting] = useState("Good day");

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Keyboard shortcut to open command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          setShowCommandPalette(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case "ai-chat":
        window.dispatchEvent(new CustomEvent("open-ai-chat"));
        break;
      case "create-space":
        window.dispatchEvent(new CustomEvent("create-project"));
        break;
      case "search":
        window.dispatchEvent(new CustomEvent("open-search"));
        break;
      case "workspace":
        router.push("/projects");
        break;
      case "summarize":
        window.dispatchEvent(new CustomEvent("summarize-workspace"));
        break;
    }
  }, [router]);

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Slash Command Palette */}
      <SlashCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {greeting}, {user?.full_name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            What would you like to work on today? Use{" "}
            <kbd className="px-2 py-1 bg-card border border-border rounded text-sm font-mono">
              /
            </kbd>{" "}
            or{" "}
            <kbd className="px-2 py-1 bg-card border border-border rounded text-sm font-mono">
              ⌘K
            </kbd>{" "}
            to access commands.
          </p>

          {/* Command Input Bar */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="w-full max-w-2xl flex items-center gap-3 px-4 py-4 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow text-left group"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <Command className="w-5 h-5 text-primary" />
            </div>
            <span className="flex-1 text-muted-foreground">Type a command or search...</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Press</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">
                /
              </kbd>
            </div>
          </button>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ActionTile
              icon={<MessageSquare className="w-6 h-6 text-purple-600" />}
              title="AI Chat"
              description="Ask AI anything about your work"
              onClick={() => handleAction("ai-chat")}
              color="hover:border-purple-300"
            />
            <ActionTile
              icon={<Plus className="w-6 h-6 text-green-600" />}
              title="Create Space"
              description="Start a new project or workspace"
              onClick={() => handleAction("create-space")}
              color="hover:border-green-300"
            />
            <ActionTile
              icon={<Search className="w-6 h-6 text-blue-600" />}
              title="Search"
              description="Find anything across your content"
              onClick={() => handleAction("search")}
              color="hover:border-blue-300"
            />
            <ActionTile
              icon={<Sparkles className="w-6 h-6 text-amber-600" />}
              title="Summarize"
              description="AI analyzes your workspace"
              onClick={() => handleAction("summarize")}
              color="hover:border-amber-300"
            />
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Workspaces */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">
                Your Workspaces
              </h3>
              <button
                onClick={() => router.push("/projects")}
                className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/projects")}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Go to Workspaces
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Manage your projects and teams
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>
            </div>
          </div>

          {/* Tips & Guide */}
          <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl border border-primary/10 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-card rounded-xl shadow-sm">
                <Zap className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  New to ScholarForge?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn how to use commands, AI features, and more to supercharge your productivity.
                </p>
                <button
                  onClick={() => router.push("/guide")}
                  className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  Open Guide <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Command Examples */}
        <div className="mt-12 p-6 bg-muted rounded-2xl">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Popular Commands
          </h3>
          <div className="flex flex-wrap gap-3">
            {[
              { cmd: "/ai chat", desc: "Open AI assistant" },
              { cmd: "/summarize", desc: "Analyze workspace" },
              { cmd: "/create task", desc: "Add new task" },
              { cmd: "/search", desc: "Search everything" },
            ].map((item) => (
              <button
                key={item.cmd}
                onClick={() => setShowCommandPalette(true)}
                className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <code className="text-sm font-mono text-primary">
                  {item.cmd}
                </code>
                <span className="text-xs text-muted-foreground">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}