"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This feature was removed in the productivity pivot
export default function WorkspaceStudyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard since this feature was removed
    router.replace("/dashboard");
  }, [router]);

  return null;
}
