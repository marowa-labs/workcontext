"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Receipt,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { usePlanStyling } from "../../hooks/usePlanStyling";

const BillingPage = () => {
  const {
    planDocContentClasses,
    planDocHeadingClasses,
    planDocLinkClasses,
    planCardClasses,
  } = usePlanStyling();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with basic features",
      features: [
        "1 active project",
        "5,000 words per month",
        "Basic AI writing assistance",
        "Standard plagiarism check",
        "5 citation formats",
        "Export to Word & PDF",
        "Community support",
      ],
      limitations: [
        "Limited collaboration features",
        "No advanced analytics",
        "Basic export options",
      ],
    },
    {
      name: "Academic",
      price: "$12",
      period: "per month",
      description: "Ideal for students and researchers",
      features: [
        "Unlimited projects",
        "50,000 words per month",
        "Advanced AI writing assistant",
        "Premium plagiarism detection",
        "All citation formats",
        "Real-time collaboration",
        "Project dashboard & analytics",
        "Export to all formats",
        "Priority email support",
        "Version history (30 days)",
      ],
      limitations: ["Limited advanced analytics"],
    },
    {
      name: "Research Pro",
      price: "$25",
      period: "per month",
      description: "For serious researchers and academics",
      features: [
        "Unlimited everything",
        "Advanced AI models",
        "Institution-grade plagiarism",
        "Custom citation styles",
        "Team collaboration tools",
        "Advanced analytics",
        "Dedicated account manager",
        "Unlimited version history",
        "Phone & chat support",
      ],
      limitations: [],
    },
  ];

  const billingSections = [
    {
      title: "Payment Methods",
      description: "Manage your payment information securely",
      icon: <CreditCard className="h-6 w-6 text-blue-600" />,
    },
    {
      title: "Billing History",
      description: "View past invoices and payment records",
      icon: <Receipt className="h-6 w-6 text-green-600" />,
    },
    {
      title: "Subscription Management",
      description: "Upgrade, downgrade, or cancel your subscription",
      icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
    },
    {
      title: "Usage Tracking",
      description: "Monitor your resource consumption",
      icon: <Calendar className="h-6 w-6 text-orange-600" />,
    },
  ];

  return (
    <div className={`min-h-screen ${planDocContentClasses}`}>
      {/* Header */}
      <div className="bg-white dark:bg-white border-b border-white border-white">
        <div className="container-custom py-6">
          <Link
            href="/docs"
            className={`inline-flex items-center ${planDocLinkClasses} mb-4`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Link>
          <div className="text-center">
            <h1 className={`text-3xl font-bold mb-2 ${planDocHeadingClasses}`}>
              Billing & Plans
            </h1>
            <p className="text-lg text-black dark:text-black">
              Understand our pricing plans and manage your subscription
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">
                Flexible Pricing Options
              </h2>
              <p className="opacity-90">
                Choose the plan that best fits your academic needs and budget
              </p>
            </div>
            <div className="flex space-x-2">
              <div className="bg-white/20 p-3 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
            Subscription Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`${planCardClasses} rounded-lg p-6 ${
                  index === 1
                    ? "border-blue-300 ring-2 ring-blue-100 relative border-white-500 dark:ring-blue-900/30"
                    : "border-white border-white"
                }`}>
                {index === 1 && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full dark:bg-blue-500">
                    MOST POPULAR
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold ${planDocHeadingClasses}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-2">
                    <span
                      className={`text-3xl font-bold ${planDocHeadingClasses}`}>
                      {plan.price}
                    </span>
                    <span className="text-black dark:text-black">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="text-black mt-2 dark:text-black">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0 dark:text-green-400" />
                      <span className="text-black dark:text-black">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <li key={limitationIndex} className="flex items-start">
                      <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0 dark:text-red-400" />
                      <span className="text-black line-through dark:text-black">
                        {limitation}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-2 rounded-lg font-medium ${
                    index === 1
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-black hover:bg-gray-200 dark:bg-white text-black dark:hover:bg-white"
                  }`}>
                  {index === 0 ? "Current Plan" : "Select Plan"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Institutional Plans */}
        <section className={`mb-8 ${planDocContentClasses}`}>
          <div className="container-custom">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Team & Institutional Plans
              </h2>
              <p className="text-xl text-black max-w-3xl mx-auto">
                Designed for universities and research institutes to empower
                entire teams with advanced academic writing tools.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-white">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      For Universities & Research Institutes
                    </h3>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      Unlimited everything - Projects, words, storage (1TB), and
                      AI usage
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      Custom templates and citation styles
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      Advanced analytics and reporting
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      SSO integration (SAML/OAuth)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      Dedicated premium support and account management
                    </span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-2xl font-bold text-white">
                    Custom Pricing
                  </div>
                  <a
                    href="/docs/contact-support"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Contact Sales
                  </a>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-white">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-purple-600 flex items-center justify-center">
                    <svg
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-white">
                      Enterprise Features
                    </h3>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">White-label options</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      Compliance-ready (FERPA/GDPR)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      Bulk user provisioning
                    </span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="ml-3 text-black">
                      Multi-year contract options
                    </span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-lg text-black">
                    Tailored solutions for your organization
                  </div>
                  <a
                    href="/docs/contact-support"
                    className="inline-flex items-center px-3 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    Learn More
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-black">
                Need a custom solution?{" "}
                <a
                  href="/docs/contact-support"
                  className="text-blue-400 hover:text-blue-300 font-medium">
                  Contact our sales team
                </a>{" "}
                for a personalized consultation.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Billing Management
            </h2>
            <div className="space-y-4">
              {billingSections.map((section, index) => (
                <div key={index} className={`${planCardClasses} p-5`}>
                  <div className="flex items-center mb-3">
                    <div className="flex-shrink-0 mr-3">{section.icon}</div>
                    <h3
                      className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                      {section.title}
                    </h3>
                  </div>
                  <p className="text-black dark:text-black">
                    {section.description}
                  </p>
                  <div className="mt-4">
                    <Link
                      href="settings/billing"
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm dark:text-blue-400 dark:hover:text-blue-300">
                      Manage {section.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className={`text-2xl font-bold mb-6 ${planDocHeadingClasses}`}>
              Billing FAQ
            </h2>
            <div className="space-y-4">
              <div className={`${planCardClasses} p-5`}>
                <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                  How do I upgrade my plan?
                </h3>
                <p className="text-black dark:text-black">
                  You can upgrade at any time from your billing settings. The
                  change will take effect immediately and you'll be charged a
                  prorated amount for the remainder of your billing cycle.
                </p>
              </div>
              <div className={`${planCardClasses} p-5`}>
                <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                  Can I cancel anytime?
                </h3>
                <p className="text-black dark:text-black">
                  Yes, you can cancel your subscription at any time. Your access
                  will continue until the end of your current billing period.
                </p>
              </div>
              <div className={`${planCardClasses} p-5`}>
                <h3 className={`font-semibold mb-2 ${planDocHeadingClasses}`}>
                  What payment methods do you accept?
                </h3>
                <p className="text-black dark:text-black">
                  We accept all major credit cards including Visa, Mastercard,
                  American Express, and Discover. We also support PayPal and
                  bank transfers for annual plans.
                </p>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-5 dark:bg-blue-900/20 border-white-800">
              <div className="flex items-center mb-3">
                <AlertCircle className="h-6 w-6 text-blue-600 mr-3 dark:text-blue-400" />
                <h3
                  className={`text-lg font-semibold ${planDocHeadingClasses}`}>
                  Student Discount
                </h3>
              </div>
              <p className="text-blue-800 dark:text-blue-200">
                Students can get 25% off any paid plan with a valid .edu email
                address. Contact support with your student ID to apply the
                discount.
              </p>
            </div>
          </div>
        </div>

        <div className={`${planCardClasses} p-6`}>
          <h2 className={`text-2xl font-bold mb-4 ${planDocHeadingClasses}`}>
            Need Help with Billing?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-3 dark:bg-blue-900/30 dark:text-blue-300">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                View Invoices
              </h3>
              <p className="text-sm text-black mt-1 dark:text-black">
                Access all your billing records
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-3 dark:bg-blue-900/30 dark:text-blue-300">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                Update Payment
              </h3>
              <p className="text-sm text-black mt-1 dark:text-black">
                Change your payment method
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-3 dark:bg-blue-900/30 dark:text-blue-300">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className={`font-semibold ${planDocHeadingClasses}`}>
                Contact Support
              </h3>
              <p className="text-sm text-black mt-1 dark:text-black">
                Get help with billing issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
