"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ResearchInterface from "../../../research/ResearchInterface";

export default function ResearchPage() {
  const router = useRouter();

  const handleSelectPaper = (paperId: string) => {
    router.push(`/dashboard/research/${paperId}`);
  };

  return (
    <div className="h-full bg-slate-50">
      <ResearchInterface onSelectPaper={handleSelectPaper} />
    </div>
  );
}
