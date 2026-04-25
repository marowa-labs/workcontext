"use client";

import Layout from "../components/Layout";
import { Button } from "../components/ui/button";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function BlogsPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 bg-white">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-8">
          <BookOpen className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Latest Insights & Blogs
        </h1>
        <p className="text-xl text-black max-w-2xl mb-10">
          Our team is busy writing the latest insights on academic integrity and
          AI. The blog section will be live very soon.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </Layout>
  );
}
