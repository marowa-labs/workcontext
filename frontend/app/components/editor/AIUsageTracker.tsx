"use client";

import { useState, useEffect } from "react";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Zap, AlertTriangle } from "lucide-react";
import useAIUsage from "../../hooks/useAIUsage";

export function AIUsageTracker() {
  const { usage, loading, error, refreshUsage } = useAIUsage();

  // Refresh usage periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUsage();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshUsage]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-xs text-black">
        <Zap className="h-3 w-3" />
        <span>Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-xs text-red-500">
        <AlertTriangle className="h-3 w-3" />
        <span>Error loading usage</span>
      </div>
    );
  }

  // All users have unlimited access
  return (
    <div className="flex items-center space-x-2 text-xs">
      <Zap className="h-3 w-3 text-green-500" />
      <Badge variant="secondary" className="text-xs">
        Unlimited
      </Badge>
    </div>
  );
}
