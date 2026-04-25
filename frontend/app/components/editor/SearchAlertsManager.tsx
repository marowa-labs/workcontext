"use client";

import { useEffect, useRef } from "react";
import SearchAlertService from "../../lib/utils/searchAlertService";
import { useToast } from "../../hooks/use-toast";
import { BellRing } from "lucide-react";
import { supabase } from "../../lib/supabase/client";

/**
 * Component that polls for new search alerts and plays a sound/shows notification
 * when new matches are found.
 * Designed to be mounted in the Editor layout.
 */
export function SearchAlertsManager() {
  const lastTotalMatchesRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Poll every 60 seconds
  const POLL_INTERVAL = 60000;

  useEffect(() => {
    // Initialize audio
    const audio = new Audio(
      "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3",
    );
    audioRef.current = audio;

    const checkAlerts = async () => {
      try {
        // Only check if we have a session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const alerts = await SearchAlertService.getAlerts();
        const currentTotalMatches = alerts.reduce(
          (sum, a) => sum + (a.new_matches_count || 0),
          0,
        );

        if (lastTotalMatchesRef.current !== null) {
          if (currentTotalMatches > lastTotalMatchesRef.current) {
            // New matches found!
            playNotificationSound();
            toast({
              title: "New Research Found",
              description: "New papers match your search alerts.",
              action: (
                <div className="flex items-center gap-2">
                  <BellRing className="h-4 w-4" />
                  <span>Check Alerts Panel</span>
                </div>
              ),
            });
          }
        }

        lastTotalMatchesRef.current = currentTotalMatches;
      } catch (error: any) {
        // Silently handle auth errors during polling
        if (
          error.message?.includes("authenticated") ||
          error.message?.includes("token")
        ) {
          return;
        }
        console.error("Failed to poll search alerts", error);
      }
    };

    // Initial check
    checkAlerts();

    const intervalId = setInterval(checkAlerts, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [toast]);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.warn(
          "Audio play blocked (user interaction required first)",
          err,
        );
      });
    }
  };

  return null; // Invisible component
}
