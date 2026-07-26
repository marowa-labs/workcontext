"use client";

import { useEffect, useRef } from "react";
import { toast } from "../hooks/use-toast";
import { Button } from "./ui/button";

const POLL_INTERVAL = 120_000;
const DISMISSED_KEY = "app-update-dismissed";

export function UpdateNotification() {
  const versionRef = useRef<string | null>(null);

  useEffect(() => {
    fetch(`/api/version?t=${Date.now()}`)
      .then((r) => r.text())
      .then((v) => {
        versionRef.current = v;
      })
      .catch(() => {});

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/version?t=${Date.now()}`);
        const newVersion = await res.text();

        if (
          versionRef.current &&
          newVersion &&
          newVersion !== versionRef.current &&
          newVersion !== localStorage.getItem(DISMISSED_KEY)
        ) {
          const { dismiss } = toast({
            title: "Update Available",
            description:
              "A new version of WorkContext is available with improvements and fixes.",
            duration: 999999,
            action: (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Update
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    localStorage.setItem(DISMISSED_KEY, newVersion);
                    dismiss();
                  }}
                >
                  Later
                </Button>
              </div>
            ),
          });

          versionRef.current = newVersion;
        }
      } catch {
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return null;
}
