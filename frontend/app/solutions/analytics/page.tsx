import React from "react";
import Layout from "../../components/Layout";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 bg-[#121212]">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-8">
          <BarChart3 className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Analytics & Insights
        </h1>
        <p className="text-xl text-black max-w-2xl mb-10">
          We are currently putting the finishing touches on our advanced
          analytics dashboard. Check back soon to see how we help you track your
          academic defensibility.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <Link href="/signup">Get Started with Available Features</Link>
        </Button>
      </div>
    </Layout>
  );
}
