"use client";

import { useState } from "react";
import {
  Check,
  Star,
  Users,
  Shield,
  Headphones,
  ChevronDown,
  ChevronUp,
  Zap,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import Layout from "../../components/Layout";
import { cn } from "../../lib/utils";
import React from "react";
import BillingService from "../../lib/utils/billingService";
import { toast } from "../../hooks/use-toast";
import { supabase } from "../../lib/supabase/client";

// Pricing Toggle Component
function PricingToggle({
  isAnnual,
  onToggle,
}: {
  isAnnual: boolean;
  onToggle: (annual: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 mb-12">
      <span
        className={cn(
          "font-medium",
          !isAnnual ? "text-white" : "text-gray-200",
        )}>
        Monthly
      </span>
      <div className="relative">
        <Switch
          checked={isAnnual}
          onCheckedChange={onToggle}
          className={cn(
            "h-8 w-14 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-white",
            "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            "hover:data-[state=unchecked]:bg-gray-500 transition-colors",
            "[&>span]:h-6 [&>span]:w-6",
            "shadow-sm hover:scale-105 transition-transform",
          )}
        />
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-medium",
            isAnnual ? "text-white" : "text-gray-200",
          )}>
          Annual
        </span>
        <Badge
          variant="secondary"
          className="bg-green-900/50 text-green-400 hover:bg-green-900/50">
          Save 30%
        </Badge>
      </div>
    </div>
  );
}

// Pricing Plans Component
function PricingPlans({
  isAnnual,
  onSelectPlan,
  loading,
}: {
  isAnnual: boolean;
  onSelectPlan?: (
    planId: "free" | "onetime" | "student" | "researcher" | "institutional",
  ) => void;
  loading?: boolean;
}) {
  const plans = [
    {
      name: "FREE",
      price: { monthly: 0, annual: 0 },
      description: "Perfect for getting",
      features: [
        "Basic templates",
        "All citation formats",
        "Export to Word/PDF",
        "Real-time collaboration (up to 10 members)",
        "7-day version history",
        "5,000 AI words/month",
        "Grammar & spell check",
        "Unlimited projects",
        "Basic writing suggestions",
        "Community support",
      ],
      cta: "Start ScholarForge AIFree",
      popular: false,
      color: "border-white",
      planId: "free",
    },
    {
      name: "ONE-TIME PAY-AS-YOU-GO",
      price: { monthly: 0, annual: 0 },
      description: "Pay only for what you use",
      features: [
        "All templates & citation formats",
        "Real-time collaboration",
        "30-day version history",
        "$15/session (minimum), usage-based overages",
        "First $15 covers up to 25,000 AIwords",
        "Additional usage billed at $0.0006/word",
        "Comments & suggestions",
        "Email support",
      ],
      cta: "Start One-Time Session",
      popular: false,
      color: "border-green-600",
      planId: "onetime",
      badge: "Pay as you go",
    },
    {
      name: "STUDENT",
      price: { monthly: 15, annual: 126 },
      description: "Eveerything students need",
      features: [
        "All templates & citation formats",
        "The Explainable Originality Map (Advanced plagiarism detection)",
        "Real-time collaboration (up to 100 members)",
        "30-day version history",
        "Writing analytics dashboard",
        "75,000 AI words/month",
        "Tone & clarity analysis",
        "Role-based permissions",
        "Email support",
      ],
      cta: "Start Student Plan",
      popular: true,
      color: "border-blue-500 ring-2 ring-blue-500 ring-opacity-20",
      planId: "student",
    },
    {
      name: "RESEARCHER",
      price: { monthly: 35, annual: 294 },
      description: "For serious researchers",
      features: [
        "All templates",
        "Custom citation styles",
        "The Explainable Originality Map (Institution-grade plagiarism detection)",
        "Unlimited collaboration",
        "Unlimited version history",
        "Advanced analytics",
        "300,000 AI words/month",
        "Advanced tone & clarity analysis",
        "Advanced role-based permissions",
        "Writing analytics dashboard",
        "The Citation Confidence Auditor",
        "The Submission-Safe Writing Mode",
        "The Defensibility Log",
        "The One-Click Publication Suite",
        "Phone & chat support",
        "Dedicated account manager",
      ],
      cta: "Start Researcher Plan",
      popular: false,
      color: "border-purple-500",
      planId: "researcher",
      badge: "Serious researchers",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {plans.map((plan, index) => (
        <Card
          key={index}
          className={cn(
            "relative bg-white border",
            plan.color,
            plan.popular && "scale-105",
          )}>
          {(plan.popular || plan.badge) && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge
                className={cn(
                  "px-4 py-1",
                  plan.popular
                    ? "bg-blue-900/50 hover:bg-blue-900/50 text-blue-300"
                    : "bg-green-900/50 hover:bg-green-900/50 text-green-300",
                )}>
                {plan.popular ? (
                  <>
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </>
                ) : (
                  plan.badge
                )}
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-6">
            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
            <p className="text-gray-200 text-sm mb-4">{plan.description}</p>

            <div className="flex flex-col items-center justify-center gap-1">
              {isAnnual && plan.price.monthly > 0 && (
                <p className="text-2xl font-bold text-white mt-2">
                  ${(plan.price.annual / 12).toFixed(2)}
                  <span className="text-lg">/month</span>
                </p>
              )}
              <div className="flex items-baseline gap-1 self-start">
                <span className="text-xl font-semibold text-gray-200">
                  ${isAnnual ? plan.price.annual : plan.price.monthly}
                </span>
                <span className="text-gray-200">
                  {plan.price.monthly === 0
                    ? ""
                    : isAnnual
                      ? "/year"
                      : "/month"}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-3">
                  <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-200">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => {
                if (onSelectPlan) {
                  onSelectPlan(plan.planId as any);
                } else {
                  // Fallback to signup link
                  window.location.href = `/signup?plan=${plan.planId}`;
                }
              }}
              disabled={loading}
              className={cn(
                "w-full",
                plan.popular
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 btn-glow"
                  : plan.planId === "onetime"
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 btn-glow"
                    : "bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-800 hover:to-gray-950 btn-glow",
              )}>
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                plan.cta
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Feature Comparison Table
function FeatureComparisonTable() {
  const [isExpanded, setIsExpanded] = useState(false);

  const features = [
    {
      category: "Projects & Documents",
      items: [
        {
          name: "Project Limit",
          free: "✗",
          onetime: "✗",
          student: "✗",
          researcher: "✗",
        },
        {
          name: "Word Limit",
          free: "✗",
          onetime: "✗",
          student: "✗",
          researcher: "✗",
        },
        {
          name: "Document Templates",
          free: "Basic",
          onetime: "All Templates",
          student: "All Templates",
          researcher: "All Templates",
        },
      ],
    },
    {
      category: "AI & Writing",
      items: [
        {
          name: "AI Writing Assistant",
          free: "Basic",
          onetime: "Advanced",
          student: "Advanced",
          researcher: "Advanced",
        },
        {
          name: "Grammar & Style Check",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Writing Suggestions",
          free: "Basic",
          onetime: "Advanced",
          student: "Advanced",
          researcher: "Advanced",
        },
        {
          name: "Tone & Clarity Analysis",
          free: "—",
          onetime: "—",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Monthly AI Word Limit",
          free: "5,000",
          onetime: "25,000",
          student: "75,000",
          researcher: "300,000",
        },
      ],
    },
    {
      category: "Integrations",
      items: [
        {
          name: "Google Drive",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "One Drive",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Mendeley",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Zotero",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
      ],
    },
    {
      category: "Import Documents",
      items: [
        {
          name: "Google Drive",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "One Drive",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Mendeley",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Zotero",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
      ],
    },
    {
      category: "Export Documents",
      items: [
        {
          name: "Google Drive",
          free: "-",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "One Drive",
          free: "-",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "OverLeaf",
          free: "-",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
      ],
    },
    {
      category: "Plagiarism & Citations",
      items: [
        {
          name: "The Explainable Originality Map",
          free: "—",
          onetime: "Basic",
          student: "Advanced",
          researcher: "Institution-grade",
        },
        {
          name: "The Citation Confidence Auditor",
          free: "—",
          onetime: "—",
          student: "—",
          researcher: "✓",
        },
        {
          name: "The Submission-Safe Writing Mode",
          free: "—",
          onetime: "—",
          student: "—",
          researcher: "✓",
        },
        {
          name: "The Defensibility Log",
          free: "—",
          onetime: "—",
          student: "—",
          researcher: "✓",
        },
        {
          name: "The One-Click Publication Suite",
          free: "—",
          onetime: "—",
          student: "—",
          researcher: "✓",
        },
        {
          name: "Source Database Size",
          free: "—",
          onetime: "10M+ sources",
          student: "100M+ sources",
          researcher: "1B+ sources",
        },
        {
          name: "Citation Formats",
          free: "All formats",
          onetime: "All formats",
          student: "All formats",
          researcher: "All & Custom formats",
        },
        {
          name: "AutoCitation Suggestion",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Bibliography Generation",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
      ],
    },
    {
      category: "Collaboration",
      items: [
        {
          name: "Real-time Editing",
          free: "—",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Comments & Suggestions",
          free: "—",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
        {
          name: "Team Members",
          free: "10 members",
          onetime: "Unlimited",
          student: "100 members",
          researcher: "Unlimited",
        },
        {
          name: "Role-based Permissions",
          free: "Basic",
          onetime: "Advanced",
          student: "Advanced",
          researcher: "Advanced",
        },
        {
          name: "Comments & Suggestions",
          free: "✓",
          onetime: "✓",
          student: "✓",
          researcher: "✓",
        },
      ],
    },
    {
      category: "Support & Analytics",
      items: [
        {
          name: "Support Level",
          free: "Community",
          onetime: "Email",
          student: "Email",
          researcher: "Phone & Chat",
        },
        {
          name: "Account Manager",
          free: "—",
          onetime: "—",
          student: "—",
          researcher: "✓",
        },
        {
          name: "Writing Analytics",
          free: "—",
          onetime: "—",
          student: "✓",
          researcher: "Advanced",
        },
      ],
    },
    {
      category: "Storage & Access",
      items: [
        {
          name: "Version History",
          free: "7 days",
          onetime: "30 days",
          student: "30 days",
          researcher: "Unlimited",
        },
      ],
    },
  ];

  const visibleFeatures = isExpanded ? features : features.slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-white overflow-hidden">
      <div className="p-8">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">
          Feature Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white sticky top-0 bg-white z-10">
                <th className="text-left py-4 pr-6 font-semibold text-white">
                  Features
                </th>
                <th className="text-center py-4 px-4 font-semibold text-white">
                  FREE
                </th>
                <th className="text-center py-4 px-4 font-semibold text-green-400">
                  ONE-TIME
                </th>
                <th className="text-center py-4 px-4 font-semibold text-blue-400">
                  STUDENT
                </th>
                <th className="text-center py-4 pl-4 font-semibold text-purple-400">
                  RESEARCHER
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleFeatures.map((category, categoryIndex) => (
                <React.Fragment key={categoryIndex}>
                  <tr className="bg-white sticky top-16 z-10">
                    <td
                      colSpan={5}
                      className="py-3 px-6 font-semibold text-gray-200 text-sm uppercase tracking-wide">
                      {category.category}
                    </td>
                  </tr>
                  {category.items.map((item, itemIndex) => (
                    <tr
                      key={itemIndex}
                      className="border-b border-white hover:bg-white/30 transition-colors">
                      <td className="py-3 pr-6 text-gray-200 font-medium">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block min-w-[20px]">
                          {item.free}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block min-w-[20px] font-medium text-green-400">
                          {item.onetime}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block min-w-[20px] font-medium text-blue-400">
                          {item.student}
                        </span>
                      </td>
                      <td className="py-3 pl-4 text-center">
                        <span className="inline-block min-w-[20px] font-medium text-purple-400">
                          {item.researcher}
                        </span>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2 border-white text-gray-200 hover:bg-white">
            {isExpanded ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show All Features
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Trust Section
function TrustSection() {
  const trustMetrics = [
    {
      icon: Users,
      number: "10,000+",
      label: "Students",
      description: "Trust ScholarForge AIdaily",
    },
    {
      icon: Shield,
      number: "99.9%",
      label: "Uptime",
      description: "Reliable when you need it",
    },
    {
      icon: Headphones,
      number: "24/7",
      label: "Support",
      description: "Always here to help",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {trustMetrics.map((metric, index) => (
        <Card key={index} className="text-center border-0 shadow-lg bg-white">
          <CardContent className="p-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
              <metric.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">
              {metric.number}
            </h3>
            <p className="text-lg font-semibold text-gray-200 mb-2">
              {metric.label}
            </p>
            <p className="text-gray-200 text-sm">{metric.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// FAQ Section
function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "Can I switch between plans anytime?",
      answer:
        "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments.",
    },
    {
      question: "Can I cancel my subscription?",
      answer:
        "Yes! You can cancel your subscription at any time. Your data remains accessible for 30 days after cancellation.",
    },
    {
      question: "Is there an academic discount?",
      answer:
        "Yes! Students with a valid .edu email address get an additional 30% off all paid plans. Verify your student status during signup.",
    },
    {
      question: "How secure is my data?",
      answer:
        "We use enterprise-grade security with end-to-end encryption, regular backups, and comply with GDPR, FERPA, and SOC 2 standards.",
    },
    {
      question: "Can I export my work if I cancel?",
      answer:
        "Absolutely! You can export all your documents and data at any time. Your data remains accessible for 30 days after cancellation.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="text-2xl font-bold text-white mb-8 text-center">
        Frequently Asked Questions
      </h3>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card key={index} className="border border-white bg-white">
            <CardContent className="p-0">
              <button
                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/50 transition-colors"
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}>
                <h4 className="font-semibold text-white pr-4">
                  {faq.question}
                </h4>
                {openFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-200" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-200" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-6">
                  <p className="text-gray-200 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Bottom CTA Section
function BottomCTA() {
  return (
    <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-white">
      <CardContent className="p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Ready to Ensure Academic Defensibility?
        </h2>
        <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
          Join thousands of students and researchers who've transformed their
          academic writing workflow with our five core functionalities: The
          Explainable Originality Map, Citation Confidence Auditor,
          Submission-Safe Writing Mode, Defensibility Log, and One-Click
          Publication Suite. Start your free trial today.
        </p>

        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 font-semibold px-8 py-6 btn-glow mb-4">
          <Link href="/signup" className="flex items-center">
            Start Your Free Trial
            <Zap className="ml-2 h-5 w-5" />
          </Link>
        </Button>

        <p className="text-gray-200 text-sm">
          No credit card required • Cancel anytime • 14-day free trial
        </p>
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true); // Changed default to true for annual billing
  const [selectedPlan, setSelectedPlan] = useState<
    "free" | "onetime" | "student" | "researcher" | "institutional" | null
  >(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (
    planId: "free" | "onetime" | "student" | "researcher" | "institutional",
  ) => {
    try {
      setLoading(true);

      // For free plan, just redirect to signup
      if (planId === "free") {
        window.location.href = `/signup?plan=${planId}`;
        return;
      }

      // For one-time payment, show the checkout flow
      if (planId === "onetime") {
        setSelectedPlan(planId);
        setShowCheckout(true);
        return;
      }

      // For institutional plan, redirect to institutional page
      if (planId === "institutional") {
        window.location.href = "/institutional";
        return;
      }

      // For subscription plans, check if user is authenticated
      // If not authenticated, show signup form first
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // User is not authenticated, redirect to signup with plan parameter
        window.location.href = `/signup?plan=${planId}&checkout=true`;
        return;
      }

      // For authenticated users, create a checkout session
      const response = await BillingService.createCheckoutSession(planId);

      if (response.success && response.checkoutUrl) {
        // Redirect to checkout
        window.location.href = response.checkoutUrl;
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create checkout session",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to select plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckoutComplete = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
    // In a real implementation, you might want to redirect or show a success message
  };

  const handleBackToPlans = () => {
    setShowCheckout(false);
    setSelectedPlan(null);
  };

  React.useEffect(() => {
    // Make handleSelectPlan available globally for the PricingPlans component
    // @ts-ignore
    window.handleSelectPlan = handleSelectPlan;
  }, [handleSelectPlan]);

  if (showCheckout && selectedPlan && selectedPlan !== "institutional") {
    return (
      <Layout>
        <section className="section-padding bg-white">
          <div className="container-custom">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-4">
                Simple, Transparent{" "}
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Pricing
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                Choose the plan that fits your academic goals. Upgrade or
                downgrade anytime.
              </p>
            </div>

            {/* Pricing Toggle */}
            <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />

            {/* Pricing Plans */}
            <PricingPlans
              isAnnual={isAnnual}
              onSelectPlan={handleSelectPlan}
              loading={loading}
            />
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-16 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800">
          <div className="container-custom">
            <FeatureComparisonTable />
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <h2 className="text-3xl font-bold text-center text-white mb-12">
              Trusted by Students Worldwide
            </h2>
            <TrustSection />
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <FAQSection />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-white">
          <div className="container-custom">
            <BottomCTA />
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-[#121212] relative overflow-hidden">
        {/* Background Image Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 z-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop')",
          }}></div>
        <div className="container-custom relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-gray-200xl font-bold text-white mb-4">
              Simple, Transparent{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
              Choose the plan that fits your academic defensibility goals.
              Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Pricing Toggle */}
          <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />

          {/* Pricing Plans */}
          <PricingPlans
            isAnnual={isAnnual}
            onSelectPlan={handleSelectPlan}
            loading={loading}
          />
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800">
        <div className="container-custom">
          <FeatureComparisonTable />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Trusted by Students Worldwide
          </h2>
          <TrustSection />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <FAQSection />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-[#121212]">
        <div className="container-custom">
          <BottomCTA />
        </div>
      </section>
    </Layout>
  );
}
