"use client";

import React, { useState, useEffect } from "react";
import { Play, Square, Timer } from "lucide-react";
import { Button } from "../../ui/button";
import {
  timeTrackingService,
  TimeEntry,
} from "../../../lib/utils/timeTrackingService";
import { useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import { supabase } from "../../../lib/supabase/client";

export const GlobalTimerWidget = () => {
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    // Only check timer if authenticated
    if (!isAuthenticated) return;

    // Initial check
    checkActiveTimer();

    // Poll every 30 seconds to stay in sync across tabs/devices
    const pollInterval = setInterval(checkActiveTimer, 30000);

    return () => clearInterval(pollInterval);
  }, [isAuthenticated]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      const startTime = new Date(activeTimer.start_time).getTime();
      interval = setInterval(() => {
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const checkActiveTimer = async () => {
    try {
      const timer = await timeTrackingService.getActiveTimer();
      setActiveTimer(timer);
    } catch (error: any) {
      // Suppress auth errors - they're expected when not logged in
      if (error?.message?.includes("Authentication required")) {
        setIsAuthenticated(false);
        return;
      }
      // Only log actual errors, not auth failures
      console.error("Failed to check active timer", error);
    }
  };

  const handleStop = async () => {
    if (!activeTimer) return;
    try {
      await timeTrackingService.stopTimer(activeTimer.id);
      setActiveTimer(null);
    } catch (error) {
      console.error("Failed to stop timer", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!activeTimer) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 bg-background border border-border rounded-lg shadow-lg p-3 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300",
        !isVisible && "hidden",
      )}>
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
          <Timer className="h-3 w-3 animate-pulse text-emerald-500" /> Tracking
          Time
        </span>
        <span className="text-sm font-medium truncate max-w-[200px]">
          {activeTimer.task?.title || "Unknown Task"}
        </span>
        <span className="text-xs font-mono text-muted-foreground">
          {formatDuration(elapsedTime)}
        </span>
      </div>

      <div className="h-8 w-[1px] bg-border mx-1" />

      <Button
        size="sm"
        variant="destructive"
        onClick={handleStop}
        className="h-8 w-8 p-0 rounded-full"
        title="Stop Timer">
        <Square className="h-3 w-3 fill-current" />
      </Button>
    </div>
  );
};
