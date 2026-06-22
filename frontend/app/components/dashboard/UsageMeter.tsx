"use client";

import { Zap, FileText, Database } from "lucide-react";

export default function UsageMeter() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Usage Overview
        </h3>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            All Features Unlocked
          </span>
        </div>
      </div>

      <div className="space-y-5 flex-grow">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Projects
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Unlimited</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Plagiarism Checks
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Unlimited</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-foreground">
                AI Words
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Unlimited</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium text-foreground">
                AI Requests
              </span>
            </div>
            <span className="text-sm text-muted-foreground">Unlimited</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground text-center">
          All features are free and unlimited for everyone.
        </p>
      </div>
    </div>
  );
}
