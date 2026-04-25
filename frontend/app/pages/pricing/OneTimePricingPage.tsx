"use client";

import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  DollarSign,
  Zap,
  Users,
  FileText,
  Search,
  Database,
  Brain,
  BarChart3,
} from "lucide-react";

const OneTimePricingPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );

  // Service pricing data
  const servicePricing = [
    {
      id: "ai",
      name: "AI Services",
      icon: Brain,
      description:
        "AI-powered writing assistance, research, and content generation",
      pricing: [
        {
          name: "AI Writing",
          cost: 0.05,
          unit: "per 1000 tokens",
          description: "AI-assisted writing and editing",
        },
        {
          name: "AI Research",
          cost: 0.1,
          unit: "per query",
          description: "AI-powered research and analysis",
        },
        {
          name: "AI Summarization",
          cost: 0.08,
          unit: "per page",
          description: "AI-generated summaries",
        },
      ],
    },
    {
      id: "storage",
      name: "Storage",
      icon: Database,
      description: "Cloud storage for your documents and files",
      pricing: [
        {
          name: "File Storage",
          cost: 0.02,
          unit: "per GB/month",
          description: "Secure cloud storage for documents",
        },
        {
          name: "File Transfer",
          cost: 0.01,
          unit: "per GB",
          description: "Upload/download data transfer",
        },
      ],
    },
    {
      id: "plagiarism",
      name: "Plagiarism Detection",
      icon: Search,
      description: "Advanced plagiarism checking and detection",
      pricing: [
        {
          name: "Basic Check",
          cost: 0.5,
          unit: "per document",
          description: "Standard plagiarism check",
        },
        {
          name: "Advanced Check",
          cost: 1.5,
          unit: "per document",
          description: "Deep plagiarism detection with sources",
        },
      ],
    },
    {
      id: "collaboration",
      name: "Collaboration Tools",
      icon: Users,
      description: "Real-time collaboration and team features",
      pricing: [
        {
          name: "Real-time Editing",
          cost: 0.1,
          unit: "per document",
          description: "Real-time collaborative editing",
        },
        {
          name: "Version Control",
          cost: 0.05,
          unit: "per version",
          description: "Document version tracking",
        },
        {
          name: "Comments & Feedback",
          cost: 0.02,
          unit: "per comment",
          description: "Collaborative feedback system",
        },
      ],
    },
    {
      id: "editor",
      name: "Editor Features",
      icon: FileText,
      description: "Advanced document editing capabilities",
      pricing: [
        {
          name: "Document Formatting",
          cost: 0.05,
          unit: "per document",
          description: "Advanced formatting tools",
        },
        {
          name: "Citation Tools",
          cost: 0.03,
          unit: "per citation",
          description: "Citation generation and management",
        },
        {
          name: "Export Services",
          cost: 0.1,
          unit: "per export",
          description: "Export to various formats",
        },
      ],
    },
  ];

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleProceed = () => {
    // Redirect to signup page with one-time payment plan
    window.location.href = "/signup?plan=onetime";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            One-Time Payment
            <span className="block text-2xl md:text-3xl font-normal text-blue-400 mt-2">
              Pay only for what you use
            </span>
          </h1>
          <p className="text-xl text-black max-w-3xl mx-auto">
            No subscriptions, no commitments. Pay only for the services you
            actually use, with transparent pricing and no hidden fees.
          </p>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white p-1 rounded-xl flex">
            <button
              className={`px-6 py-2 rounded-xl transition-all ${
                billingCycle === "monthly"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-black hover:text-white"
              }`}
              onClick={() => setBillingCycle("monthly")}>
              Pay Per Use
            </button>
          </div>
        </div>

        {/* Service Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {servicePricing.map((service) => {
            const IconComponent = service.icon;
            return (
              <Card
                key={service.id}
                className="bg-white border-white hover:border-blue-500 transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <IconComponent className="h-6 w-6 text-blue-400" />
                    </div>
                    <CardTitle className="text-xl text-white">
                      {service.name}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-black">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {service.pricing.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center pb-3 border-b border-white last:border-0 last:pb-0">
                        <div>
                          <h4 className="font-medium text-white">
                            {item.name}
                          </h4>
                          <p className="text-sm text-black">
                            {item.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            ${item.cost.toFixed(2)}
                            <span className="text-sm text-black">
                              /{item.unit}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Cost Breakdown Section */}
        <div className="bg-white rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/50 rounded-xl">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Use Services
              </h3>
              <p className="text-black">
                Use our premium features as needed without any subscription
                commitment
              </p>
            </div>
            <div className="text-center p-6 bg-white/50 rounded-xl">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Track Usage
              </h3>
              <p className="text-black">
                We automatically track your usage of each service in real-time
              </p>
            </div>
            <div className="text-center p-6 bg-white/50 rounded-xl">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Pay Per Use
              </h3>
              <p className="text-black">
                Get charged only for the services you actually use at
                transparent rates
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-black mb-8 max-w-2xl mx-auto">
            Start using our premium features today with our flexible
            pay-as-you-go model. No commitment required.
          </p>

          <Button
            size="lg"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg px-8 py-4 h-auto"
            onClick={handleProceed}>
            Start One-Time Session
          </Button>

          <p className="text-sm text-black mt-4">
            No credit card required to start. Pay only when you use premium
            features.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                How is billing calculated?
              </h3>
              <p className="text-black">
                You're charged only for the services you use. Our system tracks
                usage in real-time and applies the rates shown above. You can
                see your usage and costs at any time.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Are there any hidden fees?
              </h3>
              <p className="text-black">
                No, there are no hidden fees or surprise charges. You only pay
                for what you use, and all costs are clearly displayed before you
                use any service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I switch back to a subscription?
              </h3>
              <p className="text-black">
                Yes, you can always switch to a subscription plan if you prefer.
                Your usage history and data remain accessible regardless of your
                payment method.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneTimePricingPage;
