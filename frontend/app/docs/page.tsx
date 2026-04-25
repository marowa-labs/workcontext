"use client";

import React from "react";
import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { FileText } from "lucide-react";

export default function DocsPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 bg-[#121212]">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 mb-8">
          <FileText className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Documentation
        </h1>
        <p className="text-xl text-black max-w-2xl mb-10">
          Comprehensive guides and API references are being migrated to our new
          platform. Please check back shortly.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-gray-600 to-gray-800 text-white">
          <Link href="/help">Visit Help Center</Link>
        </Button>
      </div>
    </Layout>
  );
}
