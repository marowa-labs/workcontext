"use client";

import { use } from "react";
import PrivacyPage from "../../pages/marketing/PrivacyPage";
import DocsPage from "../../page";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default function Page({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug || [];

  if (slug.includes("privacy")) {
    return <PrivacyPage />;
  }

  return <DocsPage />;
}
