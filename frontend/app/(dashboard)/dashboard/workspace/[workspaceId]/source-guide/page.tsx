"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This feature was removed in the productivity pivot
export default function SourceGuidePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to projects page since this feature was removed
    router.replace("/dashboard");
  }, [router]);

  return null;
}
